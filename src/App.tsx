import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PathDetailPage, PathsPage } from '@/features/paths/PathPages'
import { LessonPage } from '@/features/lesson/LessonPage'
import { BookmarksPage, NotesPage, SearchPage, SettingsPage, UpcomingPage } from '@/features/personal/PersonalPages'
import { ProgressProvider } from '@/store/ProgressContext'
import { ThemeProvider } from '@/store/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="paths" element={<PathsPage />} />
              <Route path="paths/:pathId" element={<PathDetailPage />} />
              <Route path="lesson/:lessonId" element={<LessonPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="bookmarks" element={<BookmarksPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="sql"
                element={
                  <UpcomingPage title="SQL Practice" icon="database">
                    An in-browser SQLite playground with sample retail, HR and inventory datasets arrives with the SQL modules in stage 2.
                  </UpcomingPage>
                }
              />
              <Route
                path="projects"
                element={
                  <UpcomingPage title="Projects" icon="folder">
                    Six real-world projects (retail sales, customer behaviour, inventory, employee performance, process improvement, POS requirements) arrive in stage 4.
                  </UpcomingPage>
                }
              />
              <Route
                path="interview"
                element={
                  <UpcomingPage title="Interview Prep" icon="mic">
                    Separate Data Analyst and Business Analyst question banks with model answers and mock interviews arrive in stage 4.
                  </UpcomingPage>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ProgressProvider>
    </ThemeProvider>
  )
}
