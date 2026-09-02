import { zodResolver } from '@hookform/resolvers/zod'
import { IonContent, IonIcon, IonPage } from '@ionic/react'
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, shieldCheckmarkOutline, homeOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../core/supabase/client'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import './LoginPage.css'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Enter your password'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    // On success, AuthProvider's session update redirects away from /login automatically.
    if (error) setAuthError(error.message)
  }

  return (
    <IonPage>
      <IonContent fullscreen className="homeos-login-content" scrollY={false}>
        <div className="homeos-login-wrapper">
          <div className="homeos-login-panel">
            <div className="homeos-login-panel__brand">
              <span className="homeos-login-panel__mark">
                <IonIcon icon={homeOutline} />
              </span>
              <span className="homeos-login-panel__wordmark">HomeOS</span>
            </div>
            <h1 className="homeos-login-panel__title">Your home.<br />All in one place.</h1>
            <p className="homeos-login-panel__tagline">Sign in to manage your household<br />with ease and confidence.</p>
          </div>

          <div className="homeos-login-card">
            <div className="homeos-login-card__header">
              <h2>Welcome back</h2>
              <p>Sign in to continue to your HomeOS.</p>
            </div>

            <form className="homeos-login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label className="homeos-field homeos-field--icon">
                <span className="homeos-field__label">Email</span>
                <div className="homeos-field__input-wrapper">
                  <IonIcon icon={mailOutline} className="homeos-field__prefix" aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    className="homeos-field__input"
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    {...register('email')}
                  />
                </div>
                {errors.email && <span className="homeos-field__error">{errors.email.message}</span>}
              </label>

              <label className="homeos-field homeos-field--icon">
                <span className="homeos-field__label">Password</span>
                <div className="homeos-field__input-wrapper">
                  <IonIcon icon={lockClosedOutline} className="homeos-field__prefix" aria-hidden="true" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="homeos-field__input"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="homeos-field__suffix-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} aria-hidden="true" />
                  </button>
                </div>
                {errors.password && <span className="homeos-field__error">{errors.password.message}</span>}
              </label>

              {authError && (
                <p className="homeos-login-form__auth-error" role="alert">
                  {authError}
                </p>
              )}

              <PrimaryButton type="submit" disabled={isSubmitting} className="homeos-login-btn">
                {isSubmitting ? 'Logging in…' : 'Log in'}
              </PrimaryButton>

              <div className="homeos-login-privacy">
                <IonIcon icon={shieldCheckmarkOutline} />
                <span>Your household data stays private</span>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
