import { useEffect, useState, type SubmitEvent } from 'react'

type Theme = 'dark' | 'light'

type Plant = {
  id: string
  name: string
  lastWatered: string | null
  notes: string
}

const themeStorageKey = 'watered-theme'
const inventoryStorageKey = 'watered-plants'

function isPlant(value: unknown): value is Plant {
  if (!value || typeof value !== 'object') {
    return false
  }

  const plant = value as Record<string, unknown>
  if (
    typeof plant.id !== 'string' ||
    typeof plant.name !== 'string' ||
    !plant.name.trim() ||
    typeof plant.notes !== 'string' ||
    (plant.lastWatered !== null && typeof plant.lastWatered !== 'string')
  ) {
    return false
  }

  if (plant.lastWatered === null) {
    return true
  }

  const date = plant.lastWatered
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false
  }

  const [year, month, day] = date.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)
  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  )
}

function getInitialInventory(): { plants: Plant[]; error: string } {
  try {
    const storedInventory = window.localStorage.getItem(inventoryStorageKey)
    if (!storedInventory) {
      return { plants: [], error: '' }
    }

    const parsedInventory: unknown = JSON.parse(storedInventory)
    if (
      !Array.isArray(parsedInventory) ||
      !parsedInventory.every(isPlant) ||
      new Set(parsedInventory.map((plant: Plant) => plant.id)).size !==
        parsedInventory.length
    ) {
      return {
        plants: [],
        error:
          'Saved plants could not be read safely. Your inventory is protected from changes; reload after recovering the saved data.',
      }
    }

    return { plants: parsedInventory, error: '' }
  } catch {
    return {
      plants: [],
      error:
        'Saved plants could not be read. Your inventory is protected from changes; check browser storage and reload.',
    }
  }
}

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

function getDaysSinceWatered(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  const [todayYear, todayMonth, todayDay] = getToday().split('-').map(Number)
  const wateredDay = Date.UTC(year, month - 1, day)
  const currentDay = Date.UTC(todayYear, todayMonth - 1, todayDay)

  return Math.floor((currentDay - wateredDay) / 86_400_000)
}

function formatDaysAgo(date: string): string {
  const days = getDaysSinceWatered(date)
  return days > 1 ? `${days} days ago` : ''
}

function App() {
  const [initialTheme] = useState(getInitialTheme)
  const [initialInventory] = useState(getInitialInventory)
  const [theme, setTheme] = useState<Theme>(initialTheme.theme)
  const [plants, setPlants] = useState<Plant[]>(initialInventory.plants)
  const [inventoryLoadError] = useState(initialInventory.error)
  const [inventoryError, setInventoryError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [filter, setFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null)
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

  function savePlants(nextPlants: Plant[]): boolean {
    if (inventoryLoadError) {
      return false
    }

    try {
      window.localStorage.setItem(inventoryStorageKey, JSON.stringify(nextPlants))
      setPlants(nextPlants)
      setInventoryError('')
      return true
    } catch {
      setInventoryError(
        'Your change could not be saved to this device. Check browser storage and try again.',
      )
      return false
    }
  }

  function openAddForm() {
    setFormError('')
    setStatusMessage('')
    setEditingPlantId(null)
    setName('')
    setLastWatered('')
    setNotes('')
    setIsFormOpen(true)
  }

  function closeAddForm() {
    setIsFormOpen(false)
    setEditingPlantId(null)
    setName('')
    setLastWatered('')
    setNotes('')
    setFormError('')
  }

  function openEditForm(plant: Plant) {
    setStatusMessage('')
    setEditingPlantId(plant.id)
    setName(plant.name)
    setLastWatered(plant.lastWatered ?? '')
    setNotes(plant.notes)
    setFormError('')
    setIsFormOpen(true)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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

    const updatedPlant: Plant = {
      id: editingPlantId ?? crypto.randomUUID(),
      name: trimmedName,
      lastWatered: lastWatered || null,
      notes: notes.trim(),
    }
    const nextPlants = editingPlantId
      ? plants.map((plant) =>
          plant.id === editingPlantId ? updatedPlant : plant,
        )
      : [...plants, updatedPlant]

    if (!savePlants(nextPlants)) {
      return
    }

    setStatusMessage(
      editingPlantId
        ? `${trimmedName} updated.`
        : `${trimmedName} added to your plants.`,
    )
    closeAddForm()
  }

  function markWateredToday(plant: Plant) {
    const nextPlants = plants.map((currentPlant) =>
      currentPlant.id === plant.id
        ? { ...currentPlant, lastWatered: getToday() }
        : currentPlant,
    )
    if (savePlants(nextPlants)) {
      setStatusMessage(`${plant.name} marked as watered today.`)
    }
  }

  function deletePlant(plant: Plant) {
    const confirmed = window.confirm(
      `Delete ${plant.name}? This will permanently remove it from your inventory.`,
    )
    if (!confirmed) {
      return
    }

    if (savePlants(plants.filter((currentPlant) => currentPlant.id !== plant.id))) {
      setStatusMessage(`${plant.name} deleted.`)
      if (editingPlantId === plant.id) {
        closeAddForm()
      }
    }
  }

  const filteredPlants = plants.filter((plant) =>
    plant.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()),
  )

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

          <button
            className="btn btn-primary add-button"
            type="button"
            onClick={openAddForm}
            disabled={Boolean(inventoryLoadError)}
          >
            <span aria-hidden="true">+</span>
            <span>Add plant</span>
          </button>
        </div>
      </header>

      <div className="app-messages" aria-live="polite">
        {themeError && <p className="storage-notice">{themeError}</p>}
        {inventoryLoadError && (
          <p className="storage-notice storage-error" role="alert">
            {inventoryLoadError}
          </p>
        )}
        {inventoryError && (
          <p className="storage-notice storage-error" role="alert">
            {inventoryError}
          </p>
        )}
        {statusMessage && <p className="storage-notice status-message">{statusMessage}</p>}
      </div>

      <section className="inventory" aria-labelledby="inventory-title">
        <div className="inventory-heading">
          <div>
            <p className="eyebrow">YOUR LITTLE CORNER OF GREEN</p>
            <h1 id="inventory-title">Your plants</h1>
            <p className="inventory-count">
              {plants.length === 1
                ? '1 plant in your collection'
                : `${plants.length} plants in your collection`}
            </p>
          </div>
          {plants.length > 0 && (
            <span className="collection-count" aria-label={`${plants.length} plants`}>
              {String(plants.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {plants.length > 0 && (
          <div className="inventory-tools">
            <label className="search-control">
              <span className="visually-hidden">Filter plants by name</span>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle
                  cx="8.8"
                  cy="8.8"
                  r="5.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m13.2 13.2 4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
              </svg>
              <input
                className="input input-bordered"
                type="search"
                placeholder="Find a plant"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
              {filter && (
                <button
                  className="clear-filter"
                  type="button"
                  onClick={() => setFilter('')}
                  aria-label="Clear plant filter"
                >
                  Clear
                </button>
              )}
            </label>
          </div>
        )}

        {isFormOpen && (
          <div className={editingPlantId ? 'edit-overlay' : undefined}>
            <section
              className="form-panel"
              aria-labelledby="form-title"
              role={editingPlantId ? 'dialog' : undefined}
              aria-modal={editingPlantId ? true : undefined}
            >
              <div className="form-heading">
                <div>
                  <p className="eyebrow">{editingPlantId ? 'A LITTLE UPDATE' : 'A NEW LEAF'}</p>
                  <h2 id="form-title">{editingPlantId ? 'Edit plant' : 'Add a plant'}</h2>
                </div>
                <button
                  className="btn btn-ghost btn-sm close-button"
                  type="button"
                  aria-label={editingPlantId ? 'Close edit form' : 'Close add plant form'}
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
                    disabled={Boolean(inventoryLoadError)}
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
                    disabled={Boolean(inventoryLoadError)}
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
                    disabled={Boolean(inventoryLoadError)}
                  />
                </label>

                {formError && (
                  <p className="form-error" id="form-error" role="alert">
                    {formError}
                  </p>
                )}

                <div className={`form-actions${editingPlantId ? ' edit-actions' : ''}`}>
                  {editingPlantId && (
                    <button
                      className="btn btn-ghost delete-action"
                      type="button"
                      disabled={Boolean(inventoryLoadError)}
                      onClick={() => {
                        const plantToDelete = plants.find(
                          (plant) => plant.id === editingPlantId,
                        )
                        if (plantToDelete) {
                          deletePlant(plantToDelete)
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button className="btn btn-ghost" type="button" onClick={closeAddForm}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={Boolean(inventoryLoadError)}
                  >
                    {editingPlantId ? 'Save changes' : 'Save plant'}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {plants.length === 0 && !isFormOpen && !inventoryLoadError ? (
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
            filteredPlants.length > 0 ? (
              <ul className="plant-list" aria-label="Your plant collection">
                {filteredPlants.map((plant) => (
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
                      {plant.lastWatered ? (
                        <span className="watered-date-content">
                          {formatWateredDate(plant.lastWatered)}
                          {getDaysSinceWatered(plant.lastWatered) > 1 && (
                            <span className="days-ago">
                              {formatDaysAgo(plant.lastWatered)}
                            </span>
                          )}
                        </span>
                      ) : (
                        'Never watered'
                      )}
                    </p>
                    {plant.notes && <p className="plant-notes">{plant.notes}</p>}
                  </div>
                  <div className="plant-card-actions">
                    <button
                      className="btn btn-primary btn-sm water-button"
                      type="button"
                      onClick={() => markWateredToday(plant)}
                      disabled={Boolean(inventoryLoadError)}
                    >
                      Watered today
                    </button>
                    <button
                      className="btn btn-ghost btn-sm edit-toggle"
                      type="button"
                      aria-label={`Edit ${plant.name}`}
                      onClick={() => openEditForm(plant)}
                      disabled={Boolean(inventoryLoadError)}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          d="m12.9 3.2 3.9 3.9M4 16l3.2-.7L16 6.5a1.8 1.8 0 0 0-2.5-2.5l-8.8 8.8L4 16Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.6"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
              </ul>
            ) : (
              <div className="no-results">
                <h2>No plants found</h2>
                <p>Try another name or clear the filter to see your whole collection.</p>
                <button className="btn btn-ghost" type="button" onClick={() => setFilter('')}>
                  Clear filter
                </button>
              </div>
            )
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
