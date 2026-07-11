# Browser WASM triad

| Field | Value |
|-------|--------|
| Version | **0.9.6** (matches Official1 bridge) |
| Core commit | `0eaafc39` + local InitMsgV3 fixes |
| Built | 2026-07-10 |
| Toolchain | `emscripten/emsdk:3.1.60` |

## Critical fix (why Init no longer should 1006)

Upstream bug in 0.9.6: `InitMsgGeneratorV3` used `MsgCode<0>` (Init **V1** type)
while packing a **V3** body (+ rtc byte). Official1 then either:
- fails `EMSGINTEGRITY` (leftover rtc byte after V1 parse), or
- rejects with `EINITV1` on a v3 peer

→ WebSocket dies right after our 61B Init (`close 1006`).

Patches applied before this build (same as core `58031328` + compat):

1. **Send:** `MsgCode<InitMsgV3::msgcode>` (type **30**)
2. **Recv:** if type=0 but body is exactly InitMsgV3, accept as V3 (buggy peers)

## Wire version

0.9.6 → GRUNT `0x00000906`
