import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

// The component imports `addPropertyControls` / `ControlType` from "framer".
// That module only exists inside Framer, so locally we alias it to a shim.
// This keeps SkillpathCourses.tsx byte-identical between here and Framer —
// nothing has to be edited on paste.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            framer: fileURLToPath(new URL("./src/framer-shim.ts", import.meta.url)),
        },
    },
})
