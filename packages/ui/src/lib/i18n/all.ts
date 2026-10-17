// ─── Full catalog — opt-in ───────────────────────────────────────────────────
//
// Every group at once. Components never import this (they import the groups they read); it backs
// the public `getMessages` / `useT()` (see `use-t.svelte.ts`) and the `Messages` type. Because it names every group, a
// bundle that imports it ships the whole catalog: tree-shaking drops it when unused.

import { alert } from "./groups/alert.js";
import { alertDialog } from "./groups/alertDialog.js";
import { appForm } from "./groups/appForm.js";
import { appList } from "./groups/appList.js";
import { appSettings } from "./groups/appSettings.js";
import { appShell } from "./groups/appShell.js";
import { audioPlayer } from "./groups/audioPlayer.js";
import { avatar } from "./groups/avatar.js";
import { badge } from "./groups/badge.js";
import { breadcrumb } from "./groups/breadcrumb.js";
import { button } from "./groups/button.js";
import { calendar } from "./groups/calendar.js";
import { charts } from "./groups/charts.js";
import { chat } from "./groups/chat.js";
import { chip } from "./groups/chip.js";
import { codeSnippet } from "./groups/codeSnippet.js";
import { combobox } from "./groups/combobox.js";
import { commandPalette } from "./groups/commandPalette.js";
import { common } from "./groups/common.js";
import { copyButton } from "./groups/copyButton.js";
import { dataTable } from "./groups/dataTable.js";
import { dialog } from "./groups/dialog.js";
import { docs } from "./groups/docs.js";
import { drawer } from "./groups/drawer.js";
import { errorPage } from "./groups/errorPage.js";
import { exportMenu } from "./groups/exportMenu.js";
import { externalLink } from "./groups/externalLink.js";
import { fileUpload } from "./groups/fileUpload.js";
import { forms } from "./groups/forms.js";
import { installPrompt } from "./groups/installPrompt.js";
import { kit } from "./groups/kit.js";
import { kpiCard } from "./groups/kpiCard.js";
import { lightbox } from "./groups/lightbox.js";
import { liveList } from "./groups/liveList.js";
import { mediaGrid } from "./groups/mediaGrid.js";
import { mobilePane } from "./groups/mobilePane.js";
import { motionStage } from "./groups/motionStage.js";
import { notificationBell } from "./groups/notificationBell.js";
import { numberField } from "./groups/numberField.js";
import { pagination } from "./groups/pagination.js";
import { select } from "./groups/select.js";
import { sheet } from "./groups/sheet.js";
import { skipLink } from "./groups/skipLink.js";
import { slider } from "./groups/slider.js";
import { spinner } from "./groups/spinner.js";
import { stepper } from "./groups/stepper.js";
import { table } from "./groups/table.js";
import { themeToggle } from "./groups/themeToggle.js";
import { toast } from "./groups/toast.js";
import { virtualList } from "./groups/virtualList.js";

export const groups = {
	common,
	alert,
	alertDialog,
	appForm,
	kpiCard,
	appList,
	appSettings,
	appShell,
	avatar,
	button,
	skipLink,
	badge,
	breadcrumb,
	calendar,
	chip,
	codeSnippet,
	combobox,
	commandPalette,
	copyButton,
	externalLink,
	exportMenu,
	liveList,
	dataTable,
	dialog,
	docs,
	drawer,
	errorPage,
	fileUpload,
	forms,
	installPrompt,
	lightbox,
	mobilePane,
	notificationBell,
	numberField,
	pagination,
	table,
	select,
	sheet,
	slider,
	spinner,
	stepper,
	themeToggle,
	toast,
	chat,
	audioPlayer,
	motionStage,
	mediaGrid,
	virtualList,
	charts,
	kit,
};

// ─── Public full-catalog API ─────────────────────────────────────────────────

import { getGroup, type Locale, type Messages, type MessagesOverride } from "./catalog.js";

const all = Object.values(groups);

/** Messages for a locale, with optional deep overrides. Pure, so safe on the server. */
export function getMessages(id: Locale, override?: MessagesOverride): Messages {
	return Object.fromEntries(all.map((g) => [g.id, getGroup(g, id, override)])) as Messages;
}
