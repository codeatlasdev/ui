# Public CSS API: `ca-*` classes

> **Renaming or removing any class listed here is a breaking change** (requires a major/minor release with a changelog note). Consuming apps use these classes as CSS targets, so they are a public contract alongside component props. Component CSS lives in `@layer ca.components`, so a plain unlayered app rule with the same single-class selector (`.ca-btn:disabled { ... }`) overrides the kit: no doubled classes, no `!important` (see `getting-started/theming`).

Conventions: BEM (`ca-block__element`, `ca-block--modifier`). CSS variables (`--ca-*`) are NOT listed here; see `packages/ui/src/lib/styles/tokens.css`.

Generated from `grep -o 'ca-[a-z0-9_-]*'` over `packages/ui/src/lib/components/<Component>/` (`.svelte`, `.css`, `.ts`), excluding custom properties and duplicates. When you add or rename components, rerun the command and update this file. Some listed names may be `@keyframes` or internal identifiers (e.g. `ca-accordion-down`) rather than classes; treat them as stable to be safe.

Total: 749 unique classes across 68 components, plus the utility classes below.

---

## Accordion

`.ca-accordion` `.ca-accordion-down` `.ca-accordion-item` `.ca-accordion-item__body` `.ca-accordion-item__chevron` `.ca-accordion-item__content` `.ca-accordion-item__header` `.ca-accordion-item__title` `.ca-accordion-item__trigger` `.ca-accordion-up`

## Alert

`.ca-alert` `.ca-alert--error` `.ca-alert--info` `.ca-alert--success` `.ca-alert--warning` `.ca-alert__bar` `.ca-alert__body` `.ca-alert__close` `.ca-alert__content` `.ca-alert__icon` `.ca-alert__title`

## AlertDialog

`.ca-alert-dialog` `.ca-alert-dialog__actions` `.ca-dialog` `.ca-dialog--sm` `.ca-dialog__actions` `.ca-dialog__description` `.ca-dialog__header` `.ca-dialog__title` `.ca-overlay`

## AppForm

`.ca-app-form` `.ca-app-form__body` `.ca-app-form__desc` `.ca-app-form__footer` `.ca-app-form__footer-inner` `.ca-app-form__header` `.ca-app-form__header-inner` `.ca-app-form__inner` `.ca-app-form__leading` `.ca-app-form__meta` `.ca-app-form__title` `.ca-app-form__trailing` `.ca-shell__content`

## AppList

`.ca-app-list` `.ca-app-list__actions` `.ca-app-list__body` `.ca-app-list__clear` `.ca-app-list__desc` `.ca-app-list__empty` `.ca-app-list__empty-msg` `.ca-app-list__footer` `.ca-app-list__header` `.ca-app-list__meta` `.ca-app-list__sel-label` `.ca-app-list__spacer` `.ca-app-list__title` `.ca-app-list__toolbar` `.ca-app-list__toolbar-sep` `.ca-page-info` `.ca-search-field` `.ca-shell__content`

## AppSettings

`.ca-app-settings` `.ca-app-settings__actions` `.ca-app-settings__body` `.ca-app-settings__content` `.ca-app-settings__desc` `.ca-app-settings__header` `.ca-app-settings__meta` `.ca-app-settings__nav` `.ca-app-settings__nav-badge` `.ca-app-settings__nav-icon` `.ca-app-settings__nav-item` `.ca-app-settings__nav-label` `.ca-app-settings__title` `.ca-shell__content`

## AppShell

`.ca-bottom-nav` `.ca-bottom-nav__btn` `.ca-bottom-nav__btn--active` `.ca-bottom-nav__icon` `.ca-bottom-nav__label` `.ca-main` `.ca-mobile-header` `.ca-mobile-header__inner` `.ca-mobile-header__leading` `.ca-mobile-header__title` `.ca-mobile-header__title--custom` `.ca-mobile-header__trailing` `.ca-nav-item` `.ca-nav-item--active` `.ca-nav-item__badge` `.ca-nav-item__dot` `.ca-nav-item__icon` `.ca-nav-item__label` `.ca-nav-item__pip` `.ca-panel` `.ca-panel-open` `.ca-panel__header` `.ca-panel__nav` `.ca-panel__title` `.ca-rail` `.ca-rail__bottom` `.ca-rail__bottom-sep` `.ca-rail__dock` `.ca-rail__icon` `.ca-rail__icon--active` `.ca-rail__logo` `.ca-rail__logo-mark` `.ca-rail__pip` `.ca-rail__sep` `.ca-section` `.ca-section__chevron` `.ca-section__chevron--open` `.ca-section__header` `.ca-section__label` `.ca-section__trigger` `.ca-shell` `.ca-shell__content` `.ca-shell__desktop-header` `.ca-shell__mobile-header` `.ca-sidebar`

## AuthLayout

`.ca-auth` `.ca-auth-card` `.ca-auth-card__body` `.ca-auth-card__footer` `.ca-auth-card__header` `.ca-auth-card__subtitle` `.ca-auth-card__title` `.ca-auth-float` `.ca-auth__blob` `.ca-auth__blob--a` `.ca-auth__blob--b` `.ca-auth__blob--c` `.ca-auth__blobs` `.ca-auth__col` `.ca-auth__logo` `.ca-auth__mark` `.ca-auth__mobile-brand` `.ca-auth__mobile-mark` `.ca-auth__mobile-name` `.ca-auth__name` `.ca-auth__panel` `.ca-auth__panel-inner` `.ca-auth__slot`

## Avatar

`.ca-avatar` `.ca-avatar__fallback` `.ca-avatar__img` `.ca-avatar__status` `.ca-avatar__status--away` `.ca-avatar__status--busy` `.ca-avatar__status--offline` `.ca-avatar__status--online`

## Badge

`.ca-badge` `.ca-badge--brand` `.ca-badge--dot` `.ca-badge--error` `.ca-badge--success` `.ca-badge--warning` `.ca-badge-wrapper`

## Breadcrumb

`.ca-breadcrumb` `.ca-breadcrumb__current` `.ca-breadcrumb__item` `.ca-breadcrumb__link` `.ca-breadcrumb__list` `.ca-breadcrumb__sep`

## Button

`.ca-btn` `.ca-btn--destructive` `.ca-btn--filled` `.ca-btn--full-width` `.ca-btn--ghost` `.ca-btn--glass` `.ca-btn--lg` `.ca-btn--loading` `.ca-btn--md` `.ca-btn--outlined` `.ca-btn--sm` `.ca-btn__leading` `.ca-btn__trailing` `.ca-icon-btn` `.ca-icon-btn--filled` `.ca-icon-btn--glass` `.ca-icon-btn--lg` `.ca-icon-btn--loading` `.ca-icon-btn--md` `.ca-icon-btn--sm` `.ca-icon-btn--text` `.ca-spinner__arc` `.ca-spinner__track`

## Checkbox

`.ca-checkbox` `.ca-checkbox-wrapper` `.ca-checkbox__indicator` `.ca-checkbox__label` `.ca-checkbox__label--disabled`

## Chip

`.ca-chip` `.ca-chip--brand` `.ca-chip--error` `.ca-chip--info` `.ca-chip--interactive` `.ca-chip--selected` `.ca-chip--sm` `.ca-chip--success` `.ca-chip--warning` `.ca-chip__delete` `.ca-chip__icon` `.ca-chip__label`

## CodeSnippet

`.ca-code-snippet` `.ca-code-snippet__copy` `.ca-code-snippet__lang` `.ca-code-snippet__pre` `.ca-code-snippet__pre--raw` `.ca-code-snippet__toolbar`

## Collapsible

`.ca-collapsible` `.ca-collapsible__body` `.ca-collapsible__chevron` `.ca-collapsible__content` `.ca-collapsible__title` `.ca-collapsible__trigger` `.ca-slide-down` `.ca-slide-up`

## Combobox

`.ca-combobox` `.ca-combobox--error` `.ca-combobox--sm` `.ca-combobox__chevron` `.ca-combobox__content` `.ca-combobox__empty` `.ca-combobox__hint` `.ca-combobox__hint--error` `.ca-combobox__input` `.ca-combobox__item` `.ca-combobox__item-check` `.ca-combobox__item-label` `.ca-combobox__label` `.ca-combobox__req` `.ca-combobox__search-wrap` `.ca-combobox__trigger` `.ca-combobox__trigger-label` `.ca-combobox__viewport`

## CommandPalette

`.ca-cmd-dialog` `.ca-cmd-empty` `.ca-cmd-fade-in` `.ca-cmd-fade-out` `.ca-cmd-group` `.ca-cmd-group__label` `.ca-cmd-item` `.ca-cmd-item--active` `.ca-cmd-item__icon` `.ca-cmd-item__label` `.ca-cmd-item__module` `.ca-cmd-list` `.ca-cmd-overlay` `.ca-cmd-search` `.ca-cmd-search__hint` `.ca-cmd-search__icon` `.ca-cmd-search__input` `.ca-cmd-slide-in` `.ca-cmd-slide-out`

## CopyButton

`.ca-copy`

## DataTable

`.ca-col-header` `.ca-col-header__idle` `.ca-col-toggle__check` `.ca-col-toggle__content` `.ca-col-toggle__item` `.ca-col-toggle__trigger` `.ca-datatable` `.ca-datatable__clear` `.ca-datatable__empty-panel` `.ca-datatable__glass` `.ca-datatable__no-results` `.ca-datatable__no-results-icon` `.ca-datatable__no-results-inner` `.ca-datatable__no-results-sub` `.ca-datatable__no-results-title` `.ca-datatable__row--clickable` `.ca-datatable__scroll` `.ca-datatable__table` `.ca-datatable__tbody` `.ca-datatable__thead` `.ca-dt-pagination` `.ca-dt-pagination__btn` `.ca-dt-pagination__count` `.ca-dt-pagination__label` `.ca-dt-pagination__nav` `.ca-dt-pagination__select` `.ca-dt-pagination__size` `.ca-dt-toolbar` `.ca-dt-toolbar__count` `.ca-dt-toolbar__export` `.ca-dt-toolbar__input` `.ca-dt-toolbar__left` `.ca-dt-toolbar__right` `.ca-dt-toolbar__search` `.ca-dt-toolbar__search-icon` `.ca-dt-toolbar__spinner` `.ca-facet__badge` `.ca-facet__check` `.ca-facet__clear` `.ca-facet__content` `.ca-facet__count` `.ca-facet__empty` `.ca-facet__footer` `.ca-facet__item` `.ca-facet__item--active` `.ca-facet__item-label` `.ca-facet__list` `.ca-facet__sep` `.ca-facet__trigger` `.ca-spin` `.ca-table` `.ca-table-container` `.ca-table-wrap`

## Date

`.ca-cal` `.ca-cal--standalone` `.ca-cal__cell` `.ca-cal__day` `.ca-cal__grid` `.ca-cal__head-cell` `.ca-cal__header` `.ca-cal__heading` `.ca-cal__months` `.ca-cal__nav` `.ca-date` `.ca-date--disabled` `.ca-date--error` `.ca-date--sm` `.ca-date-in` `.ca-date-out` `.ca-date__content` `.ca-date__hint` `.ca-date__hint--error` `.ca-date__input` `.ca-date__label` `.ca-date__range-sep` `.ca-date__req` `.ca-date__segment` `.ca-date__sep` `.ca-date__trigger` `.ca-date__wrap` `.ca-tf`

## Dialog

`.ca-dialog` `.ca-dialog--chromeless` `.ca-dialog--split` `.ca-dialog-in` `.ca-dialog-out` `.ca-dialog__actions` `.ca-dialog__body` `.ca-dialog__description` `.ca-dialog__header` `.ca-dialog__title` `.ca-layer-close` `.ca-overlay` `.ca-overlay-in` `.ca-overlay-out`

## Divider

`.ca-divider` `.ca-divider--horizontal` `.ca-divider--vertical`

## Docs

`.ca-alert__content` `.ca-callout` `.ca-card-grid` `.ca-code` `.ca-codetab` `.ca-codetabs` `.ca-codetabs__bar` `.ca-codetabs__copy` `.ca-codetabs__panels` `.ca-codetabs__tab` `.ca-codetabs__tabs` `.ca-docs` `.ca-docs--bare` `.ca-docs-brand` `.ca-docs-content` `.ca-docs-header` `.ca-docs-header__inner` `.ca-docs-icon` `.ca-docs-main` `.ca-docs-menu` `.ca-docs-nav` `.ca-docs-nav__group` `.ca-docs-nav__label` `.ca-docs-nav__link` `.ca-docs-nav__title` `.ca-docs-search` `.ca-docs-search-btn` `.ca-docs-search-btn__label` `.ca-docs-search-icon` `.ca-docs-search-in` `.ca-docs-search-opt` `.ca-docs-search-out` `.ca-docs-search-pop-in` `.ca-docs-search-pop-out` `.ca-docs-search-results` `.ca-docs-search__bar` `.ca-docs-search__body` `.ca-docs-search__cancel` `.ca-docs-search__context` `.ca-docs-search__empty` `.ca-docs-search__enter` `.ca-docs-search__esc` `.ca-docs-search__icon` `.ca-docs-search__input` `.ca-docs-search__overlay` `.ca-docs-search__result` `.ca-docs-search__result--on` `.ca-docs-search__results` `.ca-docs-search__text` `.ca-docs-search__title` `.ca-docs-section` `.ca-docs-sections` `.ca-docs-sheet-sections` `.ca-docs-sidebar` `.ca-docs-skip` `.ca-docs-spacer` `.ca-docs-theme` `.ca-docs-toc` `.ca-docs-toc-inline` `.ca-kbd` `.ca-link-card` `.ca-link-card__desc` `.ca-link-card__title` `.ca-method` `.ca-method--pill` `.ca-method--plain` `.ca-overlay` `.ca-prose` `.ca-rail-btn` `.ca-step` `.ca-steps` `.ca-toc` `.ca-toc--inline` `.ca-toc--rail` `.ca-toc__current` `.ca-toc__label` `.ca-toc__list` `.ca-toc__sub` `.ca-toc__summary-label`

## Drawer

`.ca-drawer` `.ca-drawer--bottom` `.ca-drawer--left` `.ca-drawer--right` `.ca-drawer-bottom-in` `.ca-drawer-bottom-out` `.ca-drawer-left-in` `.ca-drawer-left-out` `.ca-drawer-right-in` `.ca-drawer-right-out` `.ca-drawer__actions` `.ca-drawer__body` `.ca-drawer__header` `.ca-drawer__title` `.ca-layer-close` `.ca-overlay` `.ca-overlay--drawer`

## DropdownMenu

`.ca-dropdown-content` `.ca-dropdown-in` `.ca-dropdown-item` `.ca-dropdown-item--destructive` `.ca-dropdown-label` `.ca-dropdown-out` `.ca-dropdown-sep` `.ca-dropdown__trigger`

## EmptyState

`.ca-empty` `.ca-empty--hero` `.ca-empty__actions` `.ca-empty__description` `.ca-empty__icon` `.ca-empty__title`

## ErrorPage

`.ca-error-page` `.ca-error-page__actions` `.ca-error-page__bubble` `.ca-error-page__hint` `.ca-error-page__inner` `.ca-error-page__status` `.ca-error-page__title`

## FileUpload

`.ca-file-upload` `.ca-file-upload--disabled` `.ca-file-upload__errors` `.ca-file-upload__file` `.ca-file-upload__file-icon` `.ca-file-upload__file-name` `.ca-file-upload__file-size` `.ca-file-upload__hint` `.ca-file-upload__icon` `.ca-file-upload__input` `.ca-file-upload__label` `.ca-file-upload__list` `.ca-file-upload__remove` `.ca-file-upload__zone` `.ca-file-upload__zone--dragging`

## FilterGroup

`.ca-filter-group` `.ca-filter-group__item` `.ca-filter-group__label`

## GlassAppBar

`.ca-app-bar` `.ca-app-bar__content` `.ca-app-bar__leading` `.ca-app-bar__trailing`

## GlassCard

`.ca-glass-card` `.ca-glass-card--flush` `.ca-glass-card--full` `.ca-glass-card__header` `.ca-glass-card__header-actions` `.ca-glass-card__title`

## Grid

`.ca-grid`

## Kbd

`.ca-kbd`

## KpiCard

`.ca-kpi` `.ca-kpi__icon` `.ca-kpi__inner` `.ca-kpi__title` `.ca-kpi__top` `.ca-kpi__trend` `.ca-kpi__trend--down` `.ca-kpi__trend--up` `.ca-kpi__unit` `.ca-kpi__value` `.ca-kpi__value-row`

## Lightbox

`.ca-lightbox` `.ca-lightbox-in` `.ca-lightbox-out` `.ca-lightbox__close` `.ca-lightbox__img` `.ca-lightbox__overlay` `.ca-lightbox__stage`

## NotificationBell

`.ca-notif-action` `.ca-notif-actions` `.ca-notif-bell` `.ca-notif-empty` `.ca-notif-header` `.ca-notif-item` `.ca-notif-item--unread` `.ca-notif-item__body` `.ca-notif-item__btn` `.ca-notif-item__dot` `.ca-notif-item__dot--default` `.ca-notif-item__dot--error` `.ca-notif-item__dot--info` `.ca-notif-item__dot--success` `.ca-notif-item__dot--warning` `.ca-notif-item__text` `.ca-notif-item__time` `.ca-notif-item__title` `.ca-notif-list` `.ca-notif-panel` `.ca-notif-title` `.ca-notif-trigger`

## MobilePane

`.ca-mobile-pane` `.ca-mobile-pane__body` `.ca-mobile-pane__body--fixed` `.ca-mobile-pane__header`

## NumberField

`.ca-nf` `.ca-nf--disabled` `.ca-nf--error` `.ca-nf--sm` `.ca-nf__btn` `.ca-nf__hint` `.ca-nf__hint--error` `.ca-nf__input` `.ca-nf__label` `.ca-nf__req` `.ca-nf__wrap` `.ca-nf__wrap--error` `.ca-nf__wrap--focused`

## PageShell

`.ca-page-shell` `.ca-page-shell__actions` `.ca-page-shell__body` `.ca-page-shell__description` `.ca-page-shell__header` `.ca-page-shell__meta` `.ca-page-shell__title` `.ca-shell__content`

## Pagination

`.ca-pagination` `.ca-pagination__ellipsis` `.ca-pagination__nav` `.ca-pagination__page`

## PinInput

`.ca-pin` `.ca-pin--disabled` `.ca-pin--error` `.ca-pin-blink` `.ca-pin__caret` `.ca-pin__cell` `.ca-pin__cells` `.ca-pin__hint` `.ca-pin__hint--error` `.ca-pin__label` `.ca-pin__root`

## Popover

`.ca-popover-content` `.ca-popover-in` `.ca-popover-out` `.ca-popover__trigger`

## Progress

`.ca-progress` `.ca-progress-shimmer` `.ca-progress__indicator` `.ca-progress__indicator--indeterminate` `.ca-progress__track`

## RadioGroup

`.ca-radio-group` `.ca-radio-group--horizontal` `.ca-radio-group--vertical` `.ca-radio-indicator` `.ca-radio-input` `.ca-radio-item` `.ca-radio-label` `.ca-radio-label--disabled`

## Row

`.ca-row` `.ca-row--wrap`

## ScrollArea

`.ca-scroll-area` `.ca-scroll-area__scrollbar` `.ca-scroll-area__scrollbar--h` `.ca-scroll-area__scrollbar--v` `.ca-scroll-area__thumb` `.ca-scroll-area__viewport`

## Select

`.ca-sel` `.ca-sel--disabled` `.ca-sel--error` `.ca-sel--sm` `.ca-sel__check` `.ca-sel__content` `.ca-sel__hint` `.ca-sel__hint--error` `.ca-sel__icon` `.ca-sel__item` `.ca-sel__item-label` `.ca-sel__label` `.ca-sel__req` `.ca-sel__trigger` `.ca-sel__value` `.ca-sel__value--placeholder`

## SettingItem

`.ca-setting-item` `.ca-setting-item__control` `.ca-setting-item__desc` `.ca-setting-item__label` `.ca-setting-item__text`

## Sheet

`.ca-layer-close` `.ca-overlay` `.ca-sheet` `.ca-sheet-fade-in` `.ca-sheet-fade-out` `.ca-sheet-in` `.ca-sheet-out` `.ca-sheet__body` `.ca-sheet__close` `.ca-sheet__description` `.ca-sheet__footer` `.ca-sheet__grab` `.ca-sheet__grab--active` `.ca-sheet__handle` `.ca-sheet__header` `.ca-sheet__meta` `.ca-sheet__overlay` `.ca-sheet__title`

## SiteHeader

`.ca-site-header` `.ca-site-header__bc-sep` `.ca-site-header__breadcrumb` `.ca-site-header__inner` `.ca-site-header__left` `.ca-site-header__sep` `.ca-site-header__toggle` `.ca-site-header__trailing`

## SkipLink

`.ca-skip-link`

## Skeleton

`.ca-shimmer` `.ca-skeleton` `.ca-skeleton--circular` `.ca-skeleton--rectangular` `.ca-skeleton--rounded` `.ca-skeleton--text` `.ca-skeleton-rows`

## Slider

`.ca-slider` `.ca-slider__range` `.ca-slider__thumb` `.ca-slider__track`

## Spinner

`.ca-spin` `.ca-spinner` `.ca-spinner__arc` `.ca-spinner__track`

## Stack

`.ca-stack`

## StatusChip

`.ca-status-chip` `.ca-status-chip--error` `.ca-status-chip--info` `.ca-status-chip--neutral` `.ca-status-chip--success` `.ca-status-chip--warning`

## Stepper

`.ca-stepper` `.ca-stepper__bubble` `.ca-stepper__desc` `.ca-stepper__label` `.ca-stepper__line` `.ca-stepper__line--done` `.ca-stepper__step` `.ca-stepper__step--active` `.ca-stepper__step--done` `.ca-stepper__text`

## StickyActions

`.ca-sticky-actions` `.ca-sticky-actions--end` `.ca-sticky-actions--stretch` `.ca-sticky-actions__inner`

## Switch

`.ca-switch` `.ca-switch-wrapper` `.ca-switch__label` `.ca-switch__label--disabled` `.ca-switch__thumb`

## Table

`.ca-table` `.ca-table--cards` `.ca-table-empty` `.ca-table-wrap` `.ca-table-wrap--cards` `.ca-user-cell` `.ca-user-cell__email` `.ca-user-cell__info` `.ca-user-cell__name`

## Tabs

`.ca-tabs` `.ca-tabs-content` `.ca-tabs-list` `.ca-tabs-trigger`

## TextArea

`.ca-ta` `.ca-ta--disabled` `.ca-ta--error` `.ca-ta__hint` `.ca-ta__hint--error` `.ca-ta__input` `.ca-ta__label` `.ca-ta__req` `.ca-ta__wrap` `.ca-ta__wrap--error` `.ca-ta__wrap--focused`

## TextField

`.ca-tf` `.ca-tf--disabled` `.ca-tf--error` `.ca-tf--sm` `.ca-tf__adorn` `.ca-tf__adorn--lead` `.ca-tf__adorn--trail` `.ca-tf__hint` `.ca-tf__hint--error` `.ca-tf__input` `.ca-tf__label` `.ca-tf__req` `.ca-tf__wrap` `.ca-tf__wrap--error` `.ca-tf__wrap--focused`

## ThemeToggle

`.ca-rail-btn` `.ca-theme-toggle` `.ca-theme-toggle__icon` `.ca-theme-toggle__icon--dark` `.ca-theme-toggle__icon--light`

## Timeline

`.ca-timeline` `.ca-timeline__connector` `.ca-timeline__content` `.ca-timeline__date` `.ca-timeline__desc` `.ca-timeline__dot` `.ca-timeline__dot--default` `.ca-timeline__dot--error` `.ca-timeline__dot--info` `.ca-timeline__dot--success` `.ca-timeline__dot--warning` `.ca-timeline__header` `.ca-timeline__item` `.ca-timeline__label` `.ca-timeline__track`

## Toast

`.ca-toast` `.ca-toast--error` `.ca-toast--info` `.ca-toast--success` `.ca-toast--visible` `.ca-toast--warning` `.ca-toast__close` `.ca-toast__icon` `.ca-toast__message` `.ca-toaster`

## ToggleGroup

`.ca-seg` `.ca-seg--md` `.ca-seg--sm` `.ca-seg__item` `.ca-seg__thumb` `.ca-toggle-group` `.ca-toggle-group--md` `.ca-toggle-group--outlined` `.ca-toggle-group--sm` `.ca-toggle-group__item`

## Tooltip

`.ca-tooltip-content` `.ca-tooltip-in` `.ca-tooltip-out` `.ca-tooltip__trigger`

## templates

`.ca-form-section` `.ca-form-section--grid` `.ca-form-section--list` `.ca-form-section--stack` `.ca-form-section__desc` `.ca-form-section__fields` `.ca-form-section__header` `.ca-form-section__title`

## Utilities

Defined in `styles/utilities.css` (layer `ca.utilities`), available wherever `global.css` or `core.css` is imported. Components reference them from markup; they carry no component CSS of their own.

`.ca-sr-only` `.ca-sr-only--focusable` `.ca-sr-only--shell`

- `.ca-sr-only`: visually hidden, still in the accessibility tree (table `<caption>`, AT-only text). Used by `Dialog`, `DocsSearch`, `Lightbox`, `Select` and the date components.
- `.ca-sr-only--focusable`: combine with `.ca-sr-only`; shown again while the element or a descendant has focus (skip links).
- `.ca-sr-only--shell`: kit-internal. Hides a page `<h1>` below 900px inside `.ca-shell__content` (`PageShell`, `AppForm`, `AppList`, `AppSettings`).

Removed in favor of `.ca-sr-only`: `.ca-dialog__sr-only`, `.ca-sel__sr`, `.ca-docs-search__sr`, `.ca-lightbox__sr`.
