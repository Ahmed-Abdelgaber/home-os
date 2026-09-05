import { IonPage, IonRouterOutlet } from '@ionic/react'
import type { ReactElement } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { useAuth } from '../core/auth/useAuth'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { ItemDetailsPage } from '../pages/ItemDetailsPage/ItemDetailsPage'
import { PurchaseProductPage } from '../pages/PurchaseProductPage/PurchaseProductPage'
import { AddExpensePage } from '../pages/AddExpensePage/AddExpensePage'
import { ExpenseDetailsPage } from '../pages/ExpenseDetailsPage/ExpenseDetailsPage'
import { ProductCatalogPage } from '../pages/ProductCatalogPage/ProductCatalogPage'
import { ProductDetailsPage } from '../pages/ProductDetailsPage/ProductDetailsPage'
import { ProductFormPage } from '../pages/ProductFormPage/ProductFormPage'
import { TripsPage } from '../pages/TripsPage/TripsPage'
import { TripFormPage } from '../pages/TripFormPage/TripFormPage'
import { AccountsPage } from '../pages/AccountsPage/AccountsPage'
import { CategoriesPage } from '../pages/CategoriesPage/CategoriesPage'
import { PeriodsPage } from '../pages/PeriodsPage/PeriodsPage'
import { PeoplePage } from '../pages/PeoplePage/PeoplePage'
import { SettingsPage } from '../pages/SettingsPage/SettingsPage'
import { ShoppingListPage } from '../pages/ShoppingListPage/ShoppingListPage'
import { BuySelectedPage } from '../pages/BuySelectedPage/BuySelectedPage'
import { PendingTransactionsPage } from '../pages/PendingTransactionsPage/PendingTransactionsPage'
import { PendingTransactionDetailsPage } from '../pages/PendingTransactionDetailsPage/PendingTransactionDetailsPage'
import { AppShell } from '../shared/components/AppShell'

/**
 * Every screen that requires a session.
 *
 * The session check is applied to this list in one place below, so a screen cannot be added
 * without it — previously each route carried its own copy of the ternary and a forgotten one
 * would have been a silently public page.
 *
 * Contextual pages push above the tab shell (docs/03), so they sit here as siblings of the
 * shell rather than inside it — that is what keeps the tab bar and FAB off them.
 */
const protectedRoutes: { path: string; element: ReactElement }[] = [
  { path: '/app/items/:itemId', element: <ItemDetailsPage /> },
  { path: '/app/purchase', element: <PurchaseProductPage /> },
  { path: '/app/shopping-list', element: <ShoppingListPage /> },
  { path: '/app/shopping-list/buy', element: <BuySelectedPage /> },
  { path: '/app/pending-transactions', element: <PendingTransactionsPage /> },
  { path: '/app/pending-transactions/:transactionId', element: <PendingTransactionDetailsPage /> },
  { path: '/app/expenses/add', element: <AddExpensePage /> },
  { path: '/app/expenses/new', element: <AddExpensePage /> },
  { path: '/app/expenses/:expenseId', element: <ExpenseDetailsPage /> },
  { path: '/app/products', element: <ProductCatalogPage /> },
  { path: '/app/products/new', element: <ProductFormPage /> },
  { path: '/app/products/:productId/edit', element: <ProductFormPage /> },
  { path: '/app/products/:productId', element: <ProductDetailsPage /> },
  { path: '/app/trips', element: <TripsPage /> },
  { path: '/app/trips/new', element: <TripFormPage /> },
  { path: '/app/trips/:tripId/edit', element: <TripFormPage /> },
  { path: '/app/accounts', element: <AccountsPage /> },
  { path: '/app/categories', element: <CategoriesPage /> },
  { path: '/app/periods', element: <PeriodsPage /> },
  { path: '/app/people', element: <PeoplePage /> },
  { path: '/app/settings', element: <SettingsPage /> },
  { path: '/app/tabs/*', element: <AppShell /> },
]

export function AppRoutes() {
  const { session, isLoading } = useAuth()

  // Stay outside the outlet while auth resolves. Mounting the outlet with a placeholder
  // wildcard route instead leaves a view item behind that Ionic never reclaims once the
  // real routes swap in, and that empty page then covers the app.
  if (isLoading) {
    return <IonPage />
  }

  // Passed as a flat array, never wrapped in a fragment: Ionic's outlet reads its Route
  // children by inspecting them directly and flattens arrays, but a fragment would hide
  // every route inside it.
  const routes = [
    <Route key="/login" path="/login" element={session ? <Navigate to="/app/tabs/home" replace /> : <LoginPage />} />,
    ...protectedRoutes.map(({ path, element }) => (
      <Route key={path} path={path} element={session ? element : <Navigate to="/login" replace />} />
    )),
    <Route key="catch-all" path="*" element={<Navigate to={session ? '/app/tabs/home' : '/login'} replace />} />,
  ]

  return <IonRouterOutlet>{routes}</IonRouterOutlet>
}
