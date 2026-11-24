import { useState, useEffect, useRef, useCallback } from 'react'
import { startExam, saveAnswers, submitExam } from '../services/examService'
import api from '../services/api'

const AUTO_SAVE_INTERVAL_MS = 8_000 // auto-save tiap 8 detik

/**
 * Hook untuk mengelola seluruh state Exam Engine.
 *
 * Flow backend:
 *   1. POST /student/exams/:examId/start  → { attempt: { id, deadline_at, … } }
 *   2. GET  /student/exams/:examId/questions → { questions, exam_title, … }
 *   3. POST /student/exams/:examId/answer   → { question_id, option_id }
 *   4. POST /student/exams/:examId/submit   → { result_id, score, … }
 *
 * @param {string|number} examId - ID ujian dari URL params
 */
export function useExam(examId) {
  // ── Session & soal ──────────────────────────────────────────────────────────
  // examId dipakai sebagai "session ID" – semua endpoint pakai examId
  const [sessionId, setSessionId] = useState(null)   // = examId setelah start
  const [examMeta, setExamMeta]   = useState(null)
  const [questions, setQuestions] = useState([])
  const [totalQ, setTotalQ]       = useState(0)

  // ── Jawaban & flag ──────────────────────────────────────────────────────────
  const [answers, setAnswers]     = useState({})     // { [question_id]: option_id }
  const [flags, setFlags]         = useState({})

  // ── Navigasi ────────────────────────────────────────────────────────────────
  const [curIndex, setCurIndex]   = useState(0)

  // ── Timer ───────────────────────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft]     = useState(null)
  const [timerStarted, setTimerStarted]   = useState(false)
  const deadlineRef                       = useRef(null)
  const timerRef                          = useRef(null)

  // ── Status UI ───────────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [saveStatus, setSaveStatus]   = useState('idle')
  const [submitting, setSubmitting]   = useState(false)

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const answersRef        = useRef({})
  const examIdRef         = useRef(null)
  const autoSaveTimerRef  = useRef(null)
  const isDirtyRef        = useRef(false)
  const submittingRef     = useRef(false)
  const autoSubmitRef     = useRef(null)

  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { submittingRef.current = submitting }, [submitting])

  // ── 1. Start exam → ambil soal ───────────────────────────────────────────────
  useEffect(() => {
    if (!examId) return
    let cancelled = false

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        // Langkah 1: mulai sesi (buat attempt)
        const startRes = await startExam(examId)
        if (cancelled) return

        const startData = startRes.data.data ?? startRes.data
        const deadlineAt = startData.deadline_at

        // Langkah 2: ambil soal
        const qRes = await api.get(`/student/exams/${examId}/questions`)
        if (cancelled) return

        const qData = qRes.data.data ?? qRes.data
        const qs = qData.questions ?? []

        // Normalisasi soal ke format yang diharapkan Exam.jsx
        // Backend mengirim options sebagai array { id, letter, text }
        // Exam.jsx mengharapkan options sebagai array { key, text }
        const normalizedQs = qs.map((q, idx) => ({
          id:      q.id,
          number:  idx + 1,
          text:    q.text,
          options: (q.options ?? []).map((opt) => ({
            key:  opt.letter ?? opt.key,
            text: opt.text,
            id:   opt.id,
          })),
        }))

        // Existing answers: { [question_id]: key }
        // Backend mengirim saved_answers: { [question_id]: option_id }
        // Kita perlu mapping option_id → key (letter)
        const savedAnswers = qData.saved_answers ?? {}
        const existingAnswers = {}
        for (const [qId, optId] of Object.entries(savedAnswers)) {
          const q = normalizedQs.find((q) => String(q.id) === String(qId))
          const opt = q?.options?.find((o) => String(o.id) === String(optId))
          if (opt) existingAnswers[qId] = opt.key
        }

        examIdRef.current = examId
        setSessionId(examId) // session = examId
        setExamMeta({
          title:   qData.exam_title ?? '',
          subject: qData.subject ?? '',
          class:   qData.class_name ?? '',
        })
        setQuestions(normalizedQs)
        setTotalQ(normalizedQs.length)
        setAnswers(existingAnswers)

        // Set deadline
        if (deadlineAt) {
          const deadline = new Date(deadlineAt)
          deadlineRef.current = deadline
          const diff = Math.max(0, Math.floor((deadline - new Date()) / 1000))
          setSecondsLeft(diff)
          setTimerStarted(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message ?? err.message ?? 'Gagal memuat ujian.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [examId])

  // ── 2. Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerStarted) return

    timerRef.current = setInterval(() => {
      if (!deadlineRef.current) return
      const diff = Math.max(0, Math.floor((deadlineRef.current - new Date()) / 1000))
      setSecondsLeft(diff)

      if (diff === 0) {
        clearInterval(timerRef.current)
        autoSubmitRef.current?.()
      }
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [timerStarted])

  // ── 3. Auto-save tiap N detik ────────────────────────────────────────────────
  const doSave = useCallback(async () => {
    const eId = examIdRef.current
    if (!eId || !isDirtyRef.current) return
    setSaveStatus('saving')
    try {
      // Simpan satu per satu jawaban yang dirty — kita kirim semua ulang
      // Backend menerima { question_id, option_id } per request
      // Untuk efisiensi, kita kirim jawaban terakhir yang diubah
      // (simple strategy: re-send semua lewat batch)
      const ans = answersRef.current
      for (const [qId, key] of Object.entries(ans)) {
        // Cari option_id dari key (letter)
        // questions tersimpan via closure — gunakan window variable
        const optId = window.__bimsExamOptionMap?.[qId]?.[key]
        if (optId === undefined) continue
        await saveAnswers(eId, { question_id: Number(qId), option_id: optId })
      }
      isDirtyRef.current = false
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return
    autoSaveTimerRef.current = setInterval(doSave, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(autoSaveTimerRef.current)
  }, [sessionId, doSave])

  // ── 4. Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const eId = examIdRef.current
    if (!eId || submittingRef.current) return null
    submittingRef.current = true
    setSubmitting(true)
    clearInterval(autoSaveTimerRef.current)
    clearInterval(timerRef.current)
    try {
      const res = await submitExam(eId)
      const data = res.data.data ?? res.data
      return data.result_id ?? data.id ?? null
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Gagal mengumpulkan ujian.')
      submittingRef.current = false
      setSubmitting(false)
      return null
    }
  }, [])

  autoSubmitRef.current = handleSubmit

  // ── Action helpers ────────────────────────────────────────────────────────────
  /**
   * Simpan jawaban satu soal.
   * @param {number} questionId
   * @param {string} key - huruf pilihan (A/B/C/D/E)
   * @param {number} optionId - id opsi di database
   */
  const setAnswer = useCallback((questionId, key, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: key }))
    isDirtyRef.current = true

    // Langsung kirim ke backend (auto-save per jawaban)
    const eId = examIdRef.current
    if (eId && optionId !== undefined) {
      setSaveStatus('saving')
      saveAnswers(eId, { question_id: Number(questionId), option_id: optionId })
        .then(() => { setSaveStatus('saved') })
        .catch(() => { setSaveStatus('error') })
    }
  }, [])

  const toggleFlag = useCallback((questionId) => {
    setFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }))
  }, [])

  const goTo = useCallback((index) => {
    setCurIndex((_prev) => {
      const max = totalQ - 1
      return Math.max(0, Math.min(index, max < 0 ? 0 : max))
    })
  }, [totalQ])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const formattedTime = secondsLeft === null
    ? '--:--'
    : `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  const isWarning = secondsLeft !== null && secondsLeft <= 300

  return {
    sessionId,
    examMeta,
    questions,
    totalQ,
    answers,
    flags,
    curIndex,
    currentQuestion: questions[curIndex] ?? null,
    answeredCount: Object.keys(answers).length,
    secondsLeft,
    formattedTime,
    isWarning,
    loading,
    error,
    saveStatus,
    submitting,
    setAnswer,
    toggleFlag,
    goTo,
    goNext: () => goTo(curIndex + 1),
    goPrev: () => goTo(curIndex - 1),
    handleSubmit,
  }
}
