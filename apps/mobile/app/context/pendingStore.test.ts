/**
 * Store de pendientes (Fase B): dedupe, throttle, force, bump optimista,
 * error sin estado, reset entre sesiones.
 */
import { createPendingStore, EMPTY_PENDING_COUNTS, isPendingKind } from "./pendingStore"

const ok = (partial: Partial<Record<string, number>>) =>
  Promise.resolve({ kind: "ok" as const, counts: { ...EMPTY_PENDING_COUNTS, ...partial } })

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe("refresh", () => {
  test("carga los cuatro contadores y calcula el total", async () => {
    const fetch = jest.fn(() => ok({ friendRequests: 2, matchChallenges: 1 }))
    const store = createPendingStore({ fetch, now: () => 1_000 })
    await store.refresh({ force: true })
    expect(store.getSnapshot()).toEqual({
      counts: {
        friendRequests: 2,
        groupFriendRequests: 0,
        matchChallenges: 1,
        guestApplications: 0,
        groupInvites: 0,
      },
      total: 3,
      lastSyncedAt: 1_000,
    })
  })

  test("llamadas concurrentes comparten la misma promesa (una sola request)", async () => {
    const d = deferred<{ kind: "ok"; counts: typeof EMPTY_PENDING_COUNTS }>()
    const fetch = jest.fn(() => d.promise)
    const store = createPendingStore({ fetch, now: () => 1_000 })
    const a = store.refresh({ force: true })
    const b = store.refresh({ force: true })
    const c = store.refresh()
    expect(fetch).toHaveBeenCalledTimes(1)
    d.resolve({ kind: "ok", counts: { ...EMPTY_PENDING_COUNTS, friendRequests: 1 } })
    await Promise.all([a, b, c])
    expect(store.getSnapshot().total).toBe(1)
  })

  test("throttle de un minuto: sin force no vuelve a pedir antes de tiempo", async () => {
    let clock = 10_000
    const fetch = jest.fn(() => ok({ friendRequests: 1 }))
    const store = createPendingStore({ fetch, now: () => clock, throttleMs: 60_000 })
    await store.refresh({ force: true })
    clock += 30_000
    await store.refresh() // dentro del throttle
    expect(fetch).toHaveBeenCalledTimes(1)
    clock += 30_001
    await store.refresh() // vencido
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test("force ignora el throttle (push recibido, pendiente resuelto)", async () => {
    const fetch = jest.fn(() => ok({}))
    const store = createPendingStore({ fetch, now: () => 5_000 })
    await store.refresh({ force: true })
    await store.refresh({ force: true })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test("la primera carga nunca se throttlea (lastSyncedAt = 0)", async () => {
    const fetch = jest.fn(() => ok({}))
    const store = createPendingStore({ fetch, now: () => 5_000 })
    await store.refresh()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test("si el endpoint falla, se conservan las cifras anteriores y no hay error", async () => {
    const results = [ok({ friendRequests: 3 }), Promise.resolve({ kind: "server" as const })]
    const fetch = jest.fn(() => results.shift()!)
    const store = createPendingStore({ fetch, now: () => 1 })
    await store.refresh({ force: true })
    await store.refresh({ force: true })
    expect(store.getSnapshot().counts.friendRequests).toBe(3)
    expect(store.getSnapshot().total).toBe(3)
  })

  test("si fetch lanza, el store sigue usable", async () => {
    const fetch = jest.fn(() => Promise.reject(new Error("boom")))
    const store = createPendingStore({ fetch, now: () => 1 })
    await expect(store.refresh({ force: true })).resolves.toBeUndefined()
    expect(store.getSnapshot().total).toBe(0)
    await store.refresh({ force: true })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test("claves desconocidas del backend se ignoran; valores inválidos quedan en 0", async () => {
    const fetch = jest.fn(() =>
      Promise.resolve({
        kind: "ok" as const,
        counts: { friendRequests: -2, groupFriendRequests: NaN, nuevaClave: 9 } as never,
      }),
    )
    const store = createPendingStore({ fetch, now: () => 1 })
    await store.refresh({ force: true })
    expect(store.getSnapshot().counts).toEqual(EMPTY_PENDING_COUNTS)
  })
})

describe("bump", () => {
  test("optimista, notifica y nunca baja de 0", async () => {
    const store = createPendingStore({ fetch: () => ok({}), now: () => 1 })
    const listener = jest.fn()
    store.subscribe(listener)
    store.bump("friendRequests", 1)
    expect(store.getSnapshot().counts.friendRequests).toBe(1)
    expect(store.getSnapshot().total).toBe(1)
    store.bump("friendRequests", -5)
    expect(store.getSnapshot().counts.friendRequests).toBe(0)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  test("claves inválidas o delta 0 no hacen nada", () => {
    const store = createPendingStore({ fetch: () => ok({}), now: () => 1 })
    const listener = jest.fn()
    store.subscribe(listener)
    store.bump("otraCosa" as never, 1)
    store.bump("friendRequests", 0)
    store.bump("friendRequests", -1) // ya está en 0
    expect(listener).not.toHaveBeenCalled()
  })
})

describe("reset (logout)", () => {
  test("vuelve a cero y descarta una respuesta de la sesión anterior que llegue tarde", async () => {
    const d = deferred<{ kind: "ok"; counts: typeof EMPTY_PENDING_COUNTS }>()
    const fetch = jest.fn(() => d.promise)
    const store = createPendingStore({ fetch, now: () => 1 })
    const pending = store.refresh({ force: true })
    store.bump("matchChallenges", 2)
    store.reset()
    expect(store.getSnapshot()).toEqual({ counts: EMPTY_PENDING_COUNTS, total: 0, lastSyncedAt: 0 })
    d.resolve({ kind: "ok", counts: { ...EMPTY_PENDING_COUNTS, friendRequests: 7 } })
    await pending
    expect(store.getSnapshot().total).toBe(0)
  })

  test("después del reset, el próximo refresh sí pide (nueva sesión)", async () => {
    const fetch = jest.fn(() => ok({ friendRequests: 1 }))
    const store = createPendingStore({ fetch, now: () => 1 })
    await store.refresh({ force: true })
    store.reset()
    await store.refresh()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(store.getSnapshot().total).toBe(1)
  })
})

test("isPendingKind valida contra el contrato", () => {
  expect(isPendingKind("friendRequests")).toBe(true)
  expect(isPendingKind("guestApplications")).toBe(true)
  expect(isPendingKind("reservations")).toBe(false)
  expect(isPendingKind(undefined)).toBe(false)
})
