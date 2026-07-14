import type { IranKetabImportDraft } from "./draft";

export type DraftAction =
  | { type: "RESET"; draft: IranKetabImportDraft }
  | { type: "SET_CATALOG_ACTION"; catalog: IranKetabImportDraft["catalog"] }
  | { type: "PATCH_CATALOG_FIELDS"; fields: Record<string, unknown> }
  | { type: "SET_EDITION"; index: number; edition: IranKetabImportDraft["editions"][number] }
  | { type: "SET_ENTITY"; index: number; entity: IranKetabImportDraft["entities"][number] }
  | { type: "EXCLUDE_ALL" };

export function iranKetabDraftReducer(state: IranKetabImportDraft, action: DraftAction): IranKetabImportDraft {
  if (action.type === "RESET") return action.draft;
  if (action.type === "SET_CATALOG_ACTION") return { ...state, catalog: action.catalog };
  if (action.type === "PATCH_CATALOG_FIELDS" && state.catalog.action === "CREATE_NEW") return { ...state, catalog: { ...state.catalog, fields: { ...state.catalog.fields, ...action.fields } } };
  if (action.type === "SET_EDITION") return { ...state, editions: state.editions.map(item => item.extractedEditionIndex === action.index ? action.edition : item) };
  if (action.type === "SET_ENTITY") return { ...state, entities: state.entities.map((item, index) => index === action.index ? action.entity : item) };
  if (action.type === "EXCLUDE_ALL") return { ...state, editions: state.editions.map(item => ({ extractedEditionIndex: item.extractedEditionIndex, action: "EXCLUDE" as const, reason: "حذف گروهی" })) };
  return state;
}
