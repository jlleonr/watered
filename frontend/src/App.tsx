import { useEffect, useState, type FormEvent } from 'react'

type Theme = 'dark' | 'light'

type Plant = {
  id: string
  name: string
  lastWatered: string | null
  notes: string
}

const themeStorageKey = 'watered-theme'

function getInitialTheme(): { theme: Theme; error: string } {
  try {
    return {
      theme: window.localStorage.getItem(themeStorageKey) === 'light' ? 'light' : 'dark',
      error: '',
    }
  } catch {
    return {
      theme: 'dark',
      error: 'Your theme choice could not be read on this device.',
    }
  }
}

function getToday(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatWateredDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(localDate)
}

function App() {
  const [initialTheme] = useState(getInitialTheme)
  const [theme, setTheme] = useState<Theme>(initialTheme.theme)
  const [plants, setPlants] = useState<Plant[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [lastWatered, setLastWatered] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [themeError, setThemeError] = useState(initialTheme.error)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme)
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme)
      setThemeError('')
    } catch {
      setThemeError('Your theme choice could not be saved on this device.')
    }
  }

  function openAddForm() {
    setFormError('')
    setIsFormOpen(true)
  }

  function closeAddForm() {
    setIsFormOpen(false)
    setName('')
    setLastWatered('')
    setNotes('')
    setFormError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError('Enter a plant name to continue.')
      return
    }

    if (lastWatered && lastWatered > getToday()) {
      setFormError('The last-watered date cannot be in the future.')
      return
    }

    setPlants((currentPlants) => [
      ...currentPlants,
      {
        id: crypto.randomUUID(),
        name: trimmedName,
        lastWatered: lastWatered || null,
        notes: notes.trim(),
      },
    ])
    closeAddForm()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Watered? home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M16 3.5C13.2 8.1 7.5 14.3 7.5 19.2a8.5 8.5 0 1 0 17 0C24.5 14.3 18.8 8.1 16 3.5Z"
                fill="currentColor"
              />
              <path
                d="M11.8 20.2c.3 2.1 1.7 3.5 3.8 4"
                stroke="var(--color-base-100)"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <span>Watered?</span>
        </a>

        <div className="topbar-actions">
          <div className="theme-picker" role="group" aria-label="Choose theme">
            <button
              className="theme-option"
              type="button"
              aria-pressed={theme === 'dark'}
              onClick={() => selectTheme('dark')}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M16.8 12.8A7.1 7.1 0 0 1 7.2 3.2a7.2 7.2 0 1 0 9.6 9.6Z"
                  fill="currentColor"
                />
              </svg>
              <span>Dark</span>
            </button>
            <button
              className="theme-option"
              type="button"
              aria-pressed={theme === 'light'}
              onClick={() => selectTheme('light')}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle
                  cx="10"
                  cy="10"
                  r="3.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M10 1.8v2m0 12.4v2M1.8 10h2m12.4 0h2M4.2 4.2l1.4 1.4m8.8 8.8 1.4 1.4m0-11.6-1.4 1.4m-8.8 8.8-1.4 1.4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
              </svg>
              <span>Light</span>
            </button>
          </div>

          <button className="btn btn-primary add-button" type="button" onClick={openAddForm}>
            <span aria-hidden="true">+</span>
            <span>Add plant</span>
          </button>
        </div>
      </header>

      {themeError && (
        <p className="storage-notice" role="status">
          {themeError}
        </p>
      )}

      <section className="inventory" aria-labelledby="inventory-title">
        <div className="inventory-heading">
          <div>
            <p className="eyebrow">YOUR LITTLE CORNER OF GREEN</p>
            <h1 id="inventory-title">Your plants</h1>
            <p className="inventory-count">
              {plants.length === 1 ? '1 plant in your collection' : `${plants.length} plants in your collection`}
            </p>
          </div>
          {plants.length > 0 && (
            <span className="collection-count" aria-label={`${plants.length} plants`}>
              {String(plants.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {isFormOpen && (
          <section className="form-panel" aria-labelledby="form-title">
            <div className="form-heading">
              <div>
                <p className="eyebrow">A NEW LEAF</p>
                <h2 id="form-title">Add a plant</h2>
              </div>
              <button
                className="btn btn-ghost btn-sm close-button"
                type="button"
                aria-label="Close add plant form"
                onClick={closeAddForm}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="m5 5 10 10M15 5 5 15"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </div>

            <form className="plant-form" onSubmit={handleSubmit} noValidate>
              <label className="form-control">
                <span className="label-text">Plant name <span aria-hidden="true">*</span></span>
                <input
                  className="input input-bordered"
                  type="text"
                  name="name"
                  autoComplete="off"
                  placeholder="e.g. Monstera"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(formError && !name.trim())}
                  aria-describedby={formError ? 'form-error' : undefined}
                  required
                  autoFocus
                />
              </label>

              <label className="form-control">
                <span className="label-text">Last watered <span className="optional-label">Optional</span></span>
                <input
                  className="input input-bordered"
                  type="date"
                  name="lastWatered"
                  max={getToday()}
                  value={lastWatered}
                  onChange={(event) => setLastWatered(event.target.value)}
                  aria-describedby={formError ? 'form-error' : 'date-hint'}
                />
                <span className="field-hint" id="date-hint">
                  Leave blank if you are not sure.
                </span>
              </label>

              <label className="form-control">
                <span className="label-text">Notes <span className="optional-label">Optional</span></span>
                <textarea
                  className="textarea textarea-bordered notes-input"
                  name="notes"
                  placeholder="A little detail to help you remember this one"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>

              {formError && (
                <p className="form-error" id="form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="form-actions">
                <button className="btn btn-ghost" type="button" onClick={closeAddForm}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save plant
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {plants.length === 0 && !isFormOpen ? (
          <div className="empty-state">
            <div className="empty-illustration" aria-hidden="true">
              <svg viewBox="0 0 160 160" fill="none">
                <circle cx="80" cy="80" r="72" fill="var(--color-secondary)" opacity=".38" />
                <path
                  d="M79.8 103.5c-17.1 0-29.7-11.6-29.7-27.7 0-15.7 12.6-28.7 29.7-43.8 17.1 15.1 29.7 28.1 29.7 43.8 0 16.1-12.6 27.7-29.7 27.7Z"
                  fill="var(--color-primary)"
                />
                <path
                  d="M80 100c-1.1-17.6-8.7-31.8-20.1-42.7M80 81.6c4.2-8.3 10.1-14.8 17.8-19.8"
                  stroke="var(--color-primary-content)"
                  strokeLinecap="round"
                  strokeWidth="3"
                  opacity=".72"
                />
                <path
                  d="M51 111h58l-6.2 27H57.2L51 111Z"
                  fill="var(--color-accent)"
                />
                <path d="M47 108h66v9H47z" fill="var(--color-warning)" />
                <path
                  d="M38 52c0-6 4.5-10.5 10.5-10.5"
                  stroke="var(--color-accent)"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <circle cx="120" cy="48" r="4" fill="var(--color-warning)" />
                <circle cx="41" cy="81" r="3" fill="var(--color-primary)" />
              </svg>
            </div>
            <p className="eyebrow">EVERY GARDEN STARTS SOMEWHERE</p>
            <h2>It’s a little quiet in here.</h2>
            <p className="empty-copy">
              Add your first plant and keep a simple note of when it was last watered.
            </p>
            <button className="btn btn-primary empty-add-button" type="button" onClick={openAddForm}>
              <span aria-hidden="true">+</span>
              Add your first plant
            </button>
          </div>
        ) : (
          plants.length > 0 && (
            <ul className="plant-list" aria-label="Your plant collection">
              {plants.map((plant) => (
                <li className="card plant-card" key={plant.id}>
                  <div className="plant-card-mark" aria-hidden="true">
                    <svg viewBox="0 0 28 28" fill="none">
                      <path
                        d="M14 24V13m0 4c-5.2 0-8.5-3.1-8.5-7.3 0-3.6 3.4-6.2 8.5-8.2 5.1 2 8.5 4.6 8.5 8.2C22.5 13.9 19.2 17 14 17Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </div>
                  <div className="plant-card-content">
                    <h2>{plant.name}</h2>
                    <p className="watered-label">LAST WATERED</p>
                    <p className="watered-date">
                      {plant.lastWatered ? formatWateredDate(plant.lastWatered) : 'Never watered'}
                    </p>
                    {plant.notes && <p className="plant-notes">{plant.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      <footer className="app-footer">
        <span className="footer-leaf" aria-hidden="true">✳</span>
        <span>A little care goes a long way.</span>
      </footer>
    </main>
  )
}

export default App
