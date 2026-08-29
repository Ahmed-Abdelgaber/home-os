import { zodResolver } from '@hookform/resolvers/zod'
import { IonContent, IonPage } from '@ionic/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../core/supabase/client'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import './LoginPage.css'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const [authError, setAuthError] = useState<string | null>(null)
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
      <IonContent fullscreen className="homeos-login-content">
        <div className="homeos-login-panel">
          <div className="homeos-login-panel__brand">
            <span className="homeos-login-panel__mark">H</span>
            <span className="homeos-login-panel__wordmark">HomeOS</span>
          </div>
          <p className="homeos-login-panel__tagline">Household operations, all in one place.</p>
        </div>

        <div className="homeos-login-card">
          <form className="homeos-login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="homeos-field">
              <span className="homeos-field__label">Email</span>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                className="homeos-field__input"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && <span className="homeos-field__error">{errors.email.message}</span>}
            </label>

            <label className="homeos-field">
              <span className="homeos-field__label">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                className="homeos-field__input"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && <span className="homeos-field__error">{errors.password.message}</span>}
            </label>

            {authError && (
              <p className="homeos-login-form__auth-error" role="alert">
                {authError}
              </p>
            )}

            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Log in'}
            </PrimaryButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  )
}
