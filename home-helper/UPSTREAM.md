Adapted for personal Sharingan TV use from https://github.com/mbsintegrations/LG-TV-HA-Home-Launcher at c242223afd3106460a4e93bfd088dc06986fd3ec.
Retains native filtering, locks, watchdogs, long-Home release, identity checks, trial limit, and service lifecycle. Removes Home Assistant watcher; redirects to com.dextor.sharingan and isolates service as com.dextor.sharingan.helper. See LICENSE and UPSTREAM-LICENSE.

RCU correction: the owner remote emits Home on LGE RCU, not M-RCU [0]. The key-only relay uses CHECK INPUT with verified identical key capabilities. A narrowly scoped capability comparison handles the source's empty EV_REL advertisement, skips nonexistent ABS axes, and fails on any unmeasured difference. Unexpected non-key/non-SYN events stop the relay. Unit tests cover rejected differences.

Long-Home correction (0.2.2): arm at two seconds but wait for physical Home key-up before releasing interception and opening LG Home. This prevents trailing held-key repeats entering LG's normal handler. A ten-second stuck-key fallback and heartbeat/pipe-close releases remain. Tests cover short edges, held repeats and long key-up.

0.3.0: Replaced the exclusive input relay with an independent read-only evdev observer. No EVIOCGRAB or input writes remain. Short Home triggers on key-up and is delayed 700 ms to follow LG's native Home handling. Controller watchdogs, identity checks, locks and user pause behavior remain. Ordinary remote input is no longer forwarded at all. Earlier relay design and capability probes are historical references only.
