import { useState, useEffect, useRef, useCallback } from 'react'
import { startExam, saveAnswers, submitExam } from '../services/examService'

const AUTO_SAVE_INTERVAL_MS = 8_000 // auto-save tiap 8 detik

/**
 * Hook untuk mengelola seluruh state Exam Engine.
 *
 * @param {string|number} examId - ID ujian dari URL params
 * @returns {object} state dan action handlers
 */
export function useExam(examId) {
  // ── Session & soal ──────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState(null)
  const [examMeta, setExamMeta] = useState(null)   // { title, subject, class }
  const [questions, setQuestions] = useState([])   // [{id, number, text, options}]
  const [totalQ, setTotalQ] = useState(0)

  // ── Jawaban & flag ──────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState({})       // { [question_id]: key }
  const [flags, setFlags] = useState({})           // { [question_id]: bool }

  // ── Navigasi ────────────────────────────────────────────────────────────────
  const [curIndex, setCurIndex] = useState(0)

  // ── Timer ───────────────────────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [timerStarted, setTimerStarted] = useState(false) // flag: deadline sudah di-set
  const deadlineRef = useRef(null)
  const timerRef = useRef(null)

  // ── Status UI ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error
  const [submitting, setSubmitting] = useState(false)

  // ── Refs (non-render, untuk diakses di effects & callbacks) ─────────────────
  const answersRef = useRef({})
  const sessionIdRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  const isDirtyRef = useRef(false)
  const submittingRef = useRef(false)
  const autoSubmitRef = useRef(null) // di-set setelah handleSubmit terdefinisi

  // Sinkronkan refs dengan state terkini
  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { submittingRef.current = submitting }, [submitting])

  // ── 1. Fetch & mulai session ─────────────────────────────────────────────────
  useEffect(() => {
    if (!examId) return
    let cancelled = false

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await startExam(examId)
        if (cancelled) return

        const data = res.data.data ?? res.data
        const {
          session_id,
          title,
          subject,
          class: className,
          deadline_at,
          questions: qs,
          existing_answers,
        } = data

        setSessionId(session_id)
        setExamMeta({ title, subject, class: className })
        setQuestions(qs ?? [])
        setTotalQ((qs ?? []).length)
        setAnswers(existing_answers ?? {})

        // Set deadline dari server, lalu hitung detik tersisa
        const deadline = new Date(deadline_at)
        deadlineRef.current = deadline
        const diff = Math.max(0, Math.floor((deadline - new Date()) / 1000))
        setSecondsLeft(diff)
        setTimerStarted(true)
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

  // ── 2. Countdown timer — hanya start sekali setelah deadline di-set ──────────
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
    const sid = sessionIdRef.current
    if (!sid || !isDirtyRef.current) return
    setSaveStatus('saving')
    try {
      await saveAnswers(sid, answersRef.current)
      isDirtyRef.current = false
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, []) // tidak ada deps karena semua lewat refs

  useEffect(() => {
    if (!sessionId) return
    autoSaveTimerRef.current = setInterval(doSave, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(autoSaveTimerRef.current)
  }, [sessionId, doSave])

  // ── 4. Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const sid = sessionIdRef.current
    if (!sid || submittingRef.current) return null
    submittingRef.current = true
    setSubmitting(true)
    clearInterval(autoSaveTimerRef.current)
    clearInterval(timerRef.current)
    try {
      const res = await submitExam(sid, answersRef.current)
      const data = res.data.data ?? res.data
      return data.result_id ?? data.id ?? null
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Gagal mengumpulkan ujian.')
      submittingRef.current = false
      setSubmitting(false)
      return null
    }
  }, []) // semua state diakses via refs

  // Simpan ref handleSubmit untuk auto-submit dari timer
  autoSubmitRef.current = handleSubmit

  // ── Action helpers ───────────────────────────────────────────────────────────
  const setAnswer = useCallback((questionId, key) => {
    setAnswers((prev) => ({ ...prev, [questionId]: key }))
    isDirtyRef.current = true
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

  // ── Derived values (dihitung setiap render, tidak via ref) ───────────────────
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
