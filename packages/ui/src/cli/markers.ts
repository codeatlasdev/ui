/**
 * Any `ca-ui-workaround` marker that excuses the line it is on or the line below: a numbered one
 * (`ca-ui-workaround(#123): reason`) or one written before the issue exists
 * (`ca-ui-workaround(pending: reason)`, `pendente:` too, #1081). Shared by `lint` and `workarounds`.
 */
export const WORKAROUND_MARKER = /ca-ui-workaround\((?:#\d+\)|(?:pending|pendente)[:)])/;
