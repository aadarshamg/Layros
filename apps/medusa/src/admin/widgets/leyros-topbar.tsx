import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Link } from "react-router-dom"
import "../styles/admin.css"

const LeyrosTopbar = () => {
  return <Link to="/overview" className="leyros-topbar-mark">LEYROS operations</Link>
}

export const config = defineWidgetConfig({
  zone: "topbar",
  id: "leyros:operations-mark",
})

export default LeyrosTopbar
