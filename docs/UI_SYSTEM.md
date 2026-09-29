# UI Design System & Style Guide

## 1. Design Philosophy & Aesthetic Vision

**QUANTUMANIA** employs a **Quantum Dark Theme** designed to evoke the futuristic, precise nature of quantum computing hardware while remaining accessible, educational, and clean.

Key aesthetic pillars:
- **Deep Space Foundations**: Slate and obsidian dark backgrounds (`#0B0F19`, `#111827`) reducing eye strain during long problem-solving sessions.
- **Quantum Accents**: Vibrant neon cyan (`#00F2FE`), electric purple (`#8A2BE2`), and emerald green (`#10B981`) highlighting active wires, gate operations, and superposition states.
- **Glassmorphic Precision**: Subtle translucent panels with backdrop blur (`backdrop-blur-md`), hairline borders (`border border-white/10`), and soft glow effects.
- **Mathematical Clarity**: Monospace fonts for statevectors, Dirac notation, and bitstrings.

---

## 2. Color Palette & Tokens

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--bg-base` | `#0B0F19` | Root page background |
| `--bg-surface` | `#111827` | Primary card and drawer backgrounds |
| `--bg-surface-elevated` | `#1F2937` | Modals, tooltips, elevated menus |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Standard card and wire divider borders |
| `--border-focus` | `#00F2FE` | Active focus rings, selected gates |
| `--text-primary` | `#F9FAFB` | Main headings, body titles |
| `--text-secondary` | `#9CA3AF` | Supporting descriptions, metadata |
| `--text-muted` | `#6B7280` | Placeholder text, wire numbers |
| `--accent-cyan` | `#00F2FE` | Hadamard gate, primary actions, running simulation |
| `--accent-purple` | `#8B5CF6` | CNOT control wire, quantum entanglement indicators |
| `--accent-emerald` | `#10B981` | Success states, verified challenges, correct answers |
| `--accent-amber` | `#F59E0B` | Warnings, hints, phase indicators |
| `--accent-rose` | `#EF4444` | Errors, invalid circuits, failed checks |

---

## 3. Typography

- **Headings Font**: `Outfit`, `sans-serif` (Modern, bold, clean geometry)
- **Body Font**: `Inter`, `sans-serif` (Optimal readability across display scales)
- **Monospace & Quantum Notation**: `Fira Code`, `monospace` (Bitstrings, Dirac notation $|00\rangle$, Python code blocks)

### Type Scale
- `display`: `2.25rem (36px)` / Line Height: `2.5rem`, Weight: 700
- `h1`: `1.875rem (30px)` / Line Height: `2.25rem`, Weight: 600
- `h2`: `1.5rem (24px)` / Line Height: `2rem`, Weight: 600
- `h3`: `1.25rem (20px)` / Line Height: `1.75rem`, Weight: 600
- `body-lg`: `1.125rem (18px)` / Line Height: `1.75rem`, Weight: 400
- `body-base`: `1rem (16px)` / Line Height: `1.5rem`, Weight: 400
- `body-sm`: `0.875rem (14px)` / Line Height: `1.25rem`, Weight: 400
- `caption`: `0.75rem (12px)` / Line Height: `1rem`, Weight: 500

---

## 4. Spacing Scale

A standard 4px/8px incremental grid:
- `space-1`: `4px`
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px`
- `space-6`: `24px`
- `space-8`: `32px`
- `space-12`: `48px`

---

## 5. Core Components

### 5.1. Buttons
- **Primary Action (Run Simulation / Submit)**:
  - Background: Gradient `from-cyan-500 to-blue-600` with subtle glow (`shadow-lg shadow-cyan-500/20`).
  - Hover: Brightness boost (`brightness-110`), transition 200ms.
- **Secondary (Add Qubit / Reset)**:
  - Background: `bg-slate-800`, Border: `border-slate-700`, Text: `text-slate-200`.
- **Ghost / Icon Button**:
  - Background: `transparent`, Hover: `bg-white/5`.

### 5.2. Quantum Circuit Controls & Palette
- **Gate Blocks**:
  - Dimensions: `44px x 44px` square tiles with rounded corners (`rounded-lg`).
  - Colors by Gate Family:
    - Single Qubit Pauli ($X, Y, Z$): Indigo/Violet gradient (`#6366F1`).
    - Superposition ($H$): Cyan/Blue gradient (`#0284C7`).
    - Two-Qubit Entangling ($CNOT$): Purple fill with white target crosshair circle.
    - Measurement: Slate block with meter gauge icon.
  - Drag States: Opacity `0.7`, drop shadow, snapping indicator ring on circuit wire intersection.
- **Circuit Grid (Wires & Steps)**:
  - Wire lines: `#374151` 2px solid lines.
  - Step column grid lines: `#1F2937` 1px dotted dividers.

### 5.3. Cards & Panels
- Background: `#111827` with `border border-white/10` and `rounded-xl`.
- Padding: `p-6` for content cards, `p-4` for compact tool panels.

### 5.4. Alerts & Notifications
- **Success Alert**: Green border (`border-emerald-500/30`), soft green tint (`bg-emerald-950/20`), green check icon.
- **Error Alert**: Red border (`border-rose-500/30`), soft red tint (`bg-rose-950/20`), warning icon.
- **AI Tutor Tip Alert**: Cyan border (`border-cyan-500/30`), soft cyan tint (`bg-cyan-950/20`), sparkler/bot icon.

### 5.5. Empty, Loading & Error States
- **Loading State**: Subtle pulsing skeleton wireframes or shimmering quantum orbital spinner.
- **Empty State**: Centered illustration, encouraging text ("No circuits saved yet. Launch the workbench to start experimenting!"), and a clear Call-To-Action button.
- **Circuit Error State**: Inline badge highlighting the erroneous gate (e.g. red dashed outline around colliding gate) with tooltip explanation.

---

## 6. Responsive Layout Breakpoints

- **Mobile (`< 768px`)**: Stacked single-column layout; circuit canvas switches to horizontal scroll mode; AI chat collapses into a bottom sheet modal.
- **Tablet (`768px - 1024px`)**: Two-column layout; split between curriculum text and circuit canvas.
- **Desktop (`> 1024px`)**: Three-panel cockpit:
  - Left: Curriculum / Objectives (30% width).
  - Center: Interactive Circuit Canvas & Histogram Visualizer (45% width).
  - Right: Grounded AI Tutor Dock & Scratchpad (25% width).
