'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { OtpInput } from '@/components/shared/OtpInput'
import { requestOtp, SIGN_IN_NOT_REGISTERED_CODE, signIn } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { clearSignInPhone, loadSignInPhone, saveSignInPhone } from '@/lib/flow-storage'
import { routes } from '@/lib/routes'
import { useAuthStore } from '@/lib/store/authStore'
import { maskIndianMobile, toE164Indian } from '@/lib/utils/phoneUtils'
import { RESEND_COOLDOWN_SECONDS } from '@/components/register/RegisterOtpDialog'
import { cn } from '@/lib/utils/cn'

/** Sign-in OTP step — /sign-in/otp */
export function SignInOtpContent() {
  const t = useTranslations()
  const router = useRouter()
  const setTokens = useAuthStore(s => s.setTokens)

  const [phoneDigits, setPhoneDigits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    const stored = loadSignInPhone()
    if (!stored) {
      router.replace(routes.signIn)
      return
    }
    setPhoneDigits(stored)
  }, [router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => {
      setResendCooldown(s => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const phoneE164 = phoneDigits ? toE164Indian(phoneDigits) : ''
  const maskedPhone = maskIndianMobile(phoneDigits)
  const canResend = resendCooldown <= 0 && !isSendingOtp

  const handleResendOtp = useCallback(async () => {
    if (!phoneE164 || resendCooldown > 0) return
    setError(null)
    setIsSendingOtp(true)
    try {
      await requestOtp({ phone: phoneE164 })
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('GLOBAL_ERROR_GENERIC'))
    } finally {
      setIsSendingOtp(false)
    }
  }, [phoneE164, resendCooldown, t])

  const handleVerifyOtp = useCallback(
    async (otpCode: string) => {
      if (!phoneE164) return
      setError(null)
      setIsVerifying(true)
      try {
        const result = await signIn({ phone: phoneE164, otp: otpCode })
        clearSignInPhone()
        setTokens(result.accessToken, result.refreshToken, result.userId)
        router.push(routes.dashboard)
      } catch (err) {
        if (err instanceof ApiError && err.code === SIGN_IN_NOT_REGISTERED_CODE) {
          clearSignInPhone()
          router.replace(routes.signIn)
          return
        }
        setError(err instanceof ApiError ? err.message : t('GLOBAL_ERROR_GENERIC'))
      } finally {
        setIsVerifying(false)
      }
    },
    [phoneE164, router, setTokens, t]
  )

  const handleBack = () => {
    saveSignInPhone(phoneDigits)
    router.push(routes.signIn)
  }

  if (!phoneDigits) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-white to-register-tint">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-page items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-50"
            aria-label={t('ARIA_GO_BACK')}
          >
            <ArrowLeft className="size-5 text-neutral-900" strokeWidth={2} aria-hidden />
          </button>
          <h1 className="text-base font-semibold text-neutral-900">{t('REGISTER_OTP_TITLE')}</h1>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-page flex-1 flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-[-0.48px] text-neutral-900">
            {t('REGISTER_OTP_TITLE')}
          </h2>
          <p className="text-[15px] leading-[22.5px] text-neutral-600">
            {t('REGISTER_OTP_SUBTITLE', { phone: maskedPhone })}
          </p>
        </div>

        <OtpInput onComplete={code => void handleVerifyOtp(code)} {...(error ? { error } : {})} disabled={isVerifying} />

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={!canResend}
            onClick={() => void handleResendOtp()}
            className={cn(
              'text-sm font-medium',
              canResend ? 'text-primary-500 hover:text-primary-600' : 'text-neutral-400'
            )}
          >
            {canResend
              ? t('REGISTER_OTP_RESEND')
              : t('REGISTER_OTP_RESEND_WAIT', { seconds: resendCooldown })}
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            {t('SIGN_IN_CHANGE_PHONE')}
          </button>
          {isVerifying && (
            <p className="text-sm text-neutral-500" aria-live="polite">
              {t('OTP_VERIFYING')}
            </p>
          )}
        </div>

        <p className="text-center text-sm text-neutral-600">
          {t('SIGN_IN_NO_ACCOUNT')}{' '}
          <Link href={routes.registerStart} className="font-semibold text-primary-500 hover:text-primary-600">
            {t('SIGN_IN_REGISTER_LINK')}
          </Link>
        </p>
      </main>
    </div>
  )
}
