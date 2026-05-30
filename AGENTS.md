use composer-2.5 for subagents, never use composer-2.5-fast for subagents

## React: avoid `useEffect`

Prefer **not** to use `useEffect`. Handle behavior through:

- **Event handlers** — user actions, callbacks, imperative handles
- **Prop-driven reset** — adjust state during render when a prop changes (compare to a stored previous value, then reset)
- **`use()`** — promises, context, and other suspendable reads
- **Animation / Pixi loops** — `useTick`, refs, and per-frame updates for visual state

If `useEffect` is unavoidable (e.g. subscribing to an external system with no event/callback API), add a **comment directly above it** explaining why other approaches do not work.
