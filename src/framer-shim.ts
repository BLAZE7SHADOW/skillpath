/**
 * Dev-only stand-in for Framer's runtime module.
 *
 * Framer provides `addPropertyControls` and `ControlType` to code components.
 * Outside Framer they don't exist, so this shim satisfies the import and does
 * nothing. It is never shipped — Vite aliases "framer" here (see vite.config.ts),
 * and inside Framer the real module wins.
 */

export const ControlType = {
    String: "string",
    Color: "color",
    Boolean: "boolean",
    Number: "number",
    Enum: "enum",
    Array: "array",
    Object: "object",
} as const

export function addPropertyControls(_component: unknown, _controls: unknown): void {
    // no-op locally; Framer reads these to build the properties panel
}
