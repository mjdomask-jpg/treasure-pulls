// Name folds shared by the checks. See docs/inherited-practices.md section 1.
//
// The soft fold is case, whitespace and apostrophe style only: two names equal
// under it are the same name by construction (data-model.md section 7, V6a).

export const soft = (s) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();
