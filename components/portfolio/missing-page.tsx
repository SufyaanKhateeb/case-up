"use client";
import Link from "next/link";
import { characterAccessories } from "@/lib/character-accessories";
import { usePortfolio } from "./runtime";

export function MissingPage() {
  const { accessories, equip } = usePortfolio();
  return <main id="main" className="missing-page grid-surface" data-character="error"><p>Page not found</p><h1>404</h1><Link className="pill" href="/">Back home <span aria-hidden="true">↖</span></Link><div className="accessory-tray" role="group" aria-label="Dress up the character">{characterAccessories.map((item) => <button className={`accessory accessory-${item.id}`} key={item.id} aria-label={`${accessories.includes(item.id) ? "Remove" : "Put on"} ${item.label.toLowerCase()}`} aria-pressed={accessories.includes(item.id)} draggable onDragStart={(event) => { event.dataTransfer.setData("text/character-accessory", item.id); event.dataTransfer.effectAllowed = "move"; }} onClick={() => equip(item.id)}><span aria-hidden="true">{item.icon}</span><small>{item.label} {accessories.includes(item.id) ? "✓" : "+"}</small></button>)}</div><p className="missing-instruction">Drag an accessory onto me,<br />or tap to try it on.</p></main>;
}
