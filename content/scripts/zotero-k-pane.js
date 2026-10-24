var ZoteroKPane = {
	addonID,
	rootURI,
	PREF_EXPANDED: "zoteroKPane.infoExpanded",
	COPY_ATTACHMENT_PATH_COMMAND_ID: "zotero-k-copy-attachment-path-command",
	COPY_ATTACHMENT_PATH_KEY_ID: "zotero-k-copy-attachment-path-key",
	COPY_ATTACHMENT_PATH_MENU_ID: "zotero-k-copy-attachment-path-menuitem",
	COMPACT_FIELD_ORDERS: {
		annotation: ["title", "date", "artworkMedium", "artworkSize", "place", "DOI", "url"],
		artwork: ["title", "artworkMedium", "artworkSize", "date", "place", "DOI", "url"],
		attachment: ["title", "accessDate", "url"],
		audioRecording: ["title", "seriesTitle", "volume", "publisher", "place", "date", "runningTime", "ISBN", "DOI"],
		bill: ["title", "billNumber", "code", "codeVolume", "section", "legislativeBody", "session", "date", "DOI"],
		blogPost: ["title", "publicationTitle", "websiteType", "date", "DOI", "ISSN", "url"],
		book: ["title", "date", "publisher", "place", "edition", "series", "seriesNumber", "volume", "numPages", "ISBN", "DOI"],
		bookSection: ["title", "bookTitle", "date", "pages", "publisher", "place", "edition", "series", "seriesNumber", "volume", "ISBN", "DOI"],
		case: ["title", "court", "dateDecided", "docketNumber", "reporter", "reporterVolume", "firstPage", "DOI", "url"],
		computerProgram: ["title", "versionNumber", "publisher", "place", "date", "programmingLanguage", "system", "DOI", "ISBN", "url"],
		conferencePaper: ["title", "proceedingsTitle", "conferenceName", "date", "place", "eventPlace", "pages", "volume", "issue", "publisher", "DOI", "ISBN"],
		dataset: ["title", "repository", "identifier", "type", "versionNumber", "date", "repositoryLocation", "format", "DOI", "url"],
		dictionaryEntry: ["title", "dictionaryTitle", "edition", "date", "publisher", "place", "pages", "ISBN", "DOI"],
		document: ["title", "type", "date", "publisher", "place", "DOI", "url"],
		email: ["title", "date", "url"],
		encyclopediaArticle: ["title", "encyclopediaTitle", "edition", "date", "publisher", "place", "pages", "ISBN", "DOI"],
		film: ["title", "publisher", "place", "date", "genre", "runningTime", "DOI", "url"],
		forumPost: ["title", "publicationTitle", "postType", "date", "DOI", "url"],
		hearing: ["title", "committee", "legislativeBody", "session", "documentNumber", "date", "pages", "publisher", "place", "DOI"],
		instantMessage: ["title", "date", "url"],
		interview: ["title", "interviewMedium", "date", "publisher", "place", "archive", "archiveLocation", "DOI", "url"],
		journalArticle: ["title", "publicationTitle", "date", "volume", "issue", "section", "pages", "journalAbbreviation", "DOI", "ISSN"],
		letter: ["title", "letterType", "date", "place", "archive", "archiveLocation", "DOI", "url"],
		magazineArticle: ["title", "publicationTitle", "date", "volume", "issue", "pages", "ISSN", "DOI", "url"],
		manuscript: ["title", "manuscriptType", "publisher", "place", "date", "numPages", "number", "archive", "archiveLocation", "DOI"],
		map: ["title", "mapType", "scale", "seriesTitle", "edition", "publisher", "place", "date", "ISBN", "DOI"],
		newspaperArticle: ["title", "publicationTitle", "date", "edition", "section", "pages", "ISSN", "DOI", "url"],
		note: [],
		patent: ["title", "country", "assignee", "patentNumber", "issuingAuthority", "issueDate", "filingDate", "applicationNumber", "pages", "DOI", "url"],
		podcast: ["title", "seriesTitle", "episodeNumber", "date", "publisher", "place", "runningTime", "DOI", "url"],
		preprint: ["title", "repository", "archiveID", "genre", "date", "series", "seriesNumber", "DOI", "url"],
		presentation: ["title", "presentationType", "meetingName", "date", "place", "sessionTitle", "DOI", "url"],
		radioBroadcast: ["title", "publicationTitle", "episodeNumber", "audioRecordingFormat", "publisher", "place", "date", "runningTime", "DOI", "url"],
		report: ["title", "reportNumber", "reportType", "publisher", "place", "date", "seriesTitle", "seriesNumber", "pages", "DOI", "ISBN"],
		standard: ["title", "organization", "type", "number", "versionNumber", "edition", "status", "date", "publisher", "place", "partNumber", "partTitle", "ISBN", "DOI"],
		statute: ["title", "code", "codeNumber", "publicLawNumber", "dateEnacted", "section", "pages", "DOI", "url"],
		thesis: ["title", "thesisType", "publisher", "place", "date", "series", "seriesNumber", "numPages", "DOI", "ISBN"],
		tvBroadcast: ["title", "publicationTitle", "episodeNumber", "videoRecordingFormat", "publisher", "place", "date", "runningTime", "DOI", "url"],
		videoRecording: ["title", "videoRecordingFormat", "seriesTitle", "volume", "publisher", "place", "date", "runningTime", "ISBN", "DOI"],
		webpage: ["title", "publicationTitle", "websiteType", "date", "publisher", "place", "accessDate", "DOI", "url"],
	},
	FALLBACK_COMPACT_FIELDS: ["title", "publicationTitle", "date", "volume", "issue", "pages", "publisher", "place", "ISBN", "DOI", "url"],
	windows: new Map(),

	hooks: {
		onStartup: async () => {
			Zotero.ZoteroKPane = ZoteroKPane;
			const win = Zotero.getMainWindow?.();
			Zotero.debug(`Compact Pane: startup; main window ${win ? "found" : "not found"}`);
			if (win) {
				ZoteroKPane.patchWindow(win);
			}
		},

		onMainWindowLoad: async (win) => {
			Zotero.debug("Compact Pane: main window load");
			ZoteroKPane.patchWindow(win);
		},

		onMainWindowUnload: async (win) => {
			ZoteroKPane.unpatchWindow(win);
		},

		onShutdown: async () => {
			for (let win of Array.from(ZoteroKPane.windows.keys())) {
				ZoteroKPane.unpatchWindow(win);
			}
			delete Zotero.ZoteroKPane;
		},
	},

	patchWindow(win) {
		if (this.windows.has(win)) {
			return;
		}

		const doc = win.document;
			const style = this.injectStyle(win);
			const patchState = {
				style,
				retryTimer: null,
				mergeRetryTimer: null,
					sidenavRetryTimer: null,
					copyAttachmentPathRetryTimer: null,
				};
				this.windows.set(win, patchState);
					this.installCopyAttachmentPathCommand(win, patchState);

			const patchInfoBox = () => {
			const InfoBox = win.customElements.get("info-box");
			if (!InfoBox) {
				win.Zotero.debug("Compact Pane: waiting for info-box custom element");
				patchState.retryTimer = win.setTimeout(patchInfoBox, 250);
				return;
			}
			if (InfoBox.prototype.__zoteroKPanePatched) {
				win.Zotero.debug("Compact Pane: info-box already patched");
				patchState.InfoBox = InfoBox;
				return;
			}

			const originalRender = InfoBox.prototype.render;
			const originalDestroy = InfoBox.prototype.destroy;

			InfoBox.prototype.render = function (...args) {
				if (ZoteroKPane.isTargetInfoBox(this)) {
					ZoteroKPane.applyInfoMode(win, this);
				}

				const result = originalRender.apply(this, args);

				if (ZoteroKPane.isTargetInfoBox(this)) {
					ZoteroKPane.ensureToggleButton(win, this);
					ZoteroKPane.updateToggleButton(win, this);
				}

				return result;
			};

			InfoBox.prototype.destroy = function (...args) {
			if (ZoteroKPane.isTargetInfoBox(this)) {
				const button = this.querySelector(".zotero-k-info-toggle");
				if (button?._zoteroKHandler) {
					button.removeEventListener("command", button._zoteroKHandler);
				}
			}
				return originalDestroy.apply(this, args);
			};

			InfoBox.prototype.__zoteroKPanePatched = {
				originalRender,
				originalDestroy,
			};
			patchState.InfoBox = InfoBox;
			win.Zotero.debug("Compact Pane: patched info-box render");

			const infoBox = doc.getElementById("zotero-editpane-info-box");
			if (infoBox) {
				win.Zotero.debug("Compact Pane: forcing current info-box render");
				this.applyInfoMode(win, infoBox);
				this.forceRender(infoBox);
			}
			else {
				win.Zotero.debug("Compact Pane: current info-box not found");
			}
		};

		patchInfoBox();

		const patchItemPaneSidenav = () => {
			const ItemPaneSidenav = win.customElements.get("item-pane-sidenav");
			if (!ItemPaneSidenav) {
				win.Zotero.debug("Compact Pane: waiting for item-pane-sidenav custom element");
				patchState.sidenavRetryTimer = win.setTimeout(patchItemPaneSidenav, 250);
				return;
			}
			if (ItemPaneSidenav.prototype.__zoteroKPaneSidenavPatched) {
				win.Zotero.debug("Compact Pane: item-pane-sidenav already patched");
				patchState.ItemPaneSidenav = ItemPaneSidenav;
				return;
			}

			const originalRender = ItemPaneSidenav.prototype.render;
			const originalRenderDefaultStatus = ItemPaneSidenav.prototype.renderDefaultStatus;
			const originalUpdatePaneStatus = ItemPaneSidenav.prototype.updatePaneStatus;

			ItemPaneSidenav.prototype.render = function (...args) {
				const result = originalRender.apply(this, args);
				ZoteroKPane.restoreSidenavPaneButtons(win, this);
				return result;
			};

			ItemPaneSidenav.prototype.renderDefaultStatus = function (...args) {
				const result = originalRenderDefaultStatus.apply(this, args);
				ZoteroKPane.restoreSidenavPaneButtons(win, this);
				return result;
			};

			ItemPaneSidenav.prototype.updatePaneStatus = function (...args) {
				const result = originalUpdatePaneStatus.apply(this, args);
				ZoteroKPane.restoreSidenavPaneButtons(win, this);
				return result;
			};

			ItemPaneSidenav.prototype.__zoteroKPaneSidenavPatched = {
				originalRender,
				originalRenderDefaultStatus,
				originalUpdatePaneStatus,
			};
			patchState.ItemPaneSidenav = ItemPaneSidenav;
			win.Zotero.debug("Compact Pane: patched item-pane-sidenav default visibility");

			const sidenav = doc.getElementById("zotero-view-item-sidenav");
			if (sidenav) {
				this.restoreSidenavPaneButtons(win, sidenav);
			}
		};

		patchItemPaneSidenav();

		const patchDuplicatesMergePane = () => {
			const DuplicatesMergePane = win.customElements.get("duplicates-merge-pane");
			if (!DuplicatesMergePane) {
				win.Zotero.debug("Compact Pane: waiting for duplicates-merge-pane custom element");
				patchState.mergeRetryTimer = win.setTimeout(patchDuplicatesMergePane, 250);
				return;
			}
			if (DuplicatesMergePane.prototype.__zoteroKMergeGuarded) {
				win.Zotero.debug("Compact Pane: duplicates merge pane already guarded");
				patchState.DuplicatesMergePane = DuplicatesMergePane;
				return;
			}

			const originalSetItems = DuplicatesMergePane.prototype.setItems;
			const originalMerge = DuplicatesMergePane.prototype.merge;

			DuplicatesMergePane.prototype.setItems = function (...args) {
				this._zoteroKMergeRunning = false;
				const result = originalSetItems.apply(this, args);
				const button = this.querySelector("#zotero-duplicates-merge-button");
				if (button) {
					button.disabled = false;
				}
				return result;
			};

			DuplicatesMergePane.prototype.merge = async function (...args) {
				const button = this.querySelector("#zotero-duplicates-merge-button");
				if (this._zoteroKMergeRunning) {
					win.Zotero.debug("Compact Pane: blocked repeated merge command");
					return;
				}

				this._zoteroKMergeRunning = true;
				if (button) {
					button.disabled = true;
				}

				try {
					const result = await originalMerge.apply(this, args);
					return result;
				}
				finally {
					this._zoteroKMergeRunning = false;
					if (button) {
						button.disabled = false;
					}
				}
			};

			DuplicatesMergePane.prototype.__zoteroKMergeGuarded = {
				originalSetItems,
				originalMerge,
			};
			patchState.DuplicatesMergePane = DuplicatesMergePane;
			win.Zotero.debug("Compact Pane: guarded duplicates merge pane");
		};

		patchDuplicatesMergePane();
	},

	unpatchWindow(win) {
		const state = this.windows.get(win);
		if (!state) {
			return;
		}

		if (state.retryTimer) {
			win.clearTimeout(state.retryTimer);
		}
		if (state.mergeRetryTimer) {
			win.clearTimeout(state.mergeRetryTimer);
		}
			if (state.sidenavRetryTimer) {
				win.clearTimeout(state.sidenavRetryTimer);
			}
				if (state.copyAttachmentPathRetryTimer) {
					win.clearTimeout(state.copyAttachmentPathRetryTimer);
				}
				if (state.copyAttachmentPathPopupHandler && state.copyAttachmentPathMenu) {
					state.copyAttachmentPathMenu.removeEventListener("popupshowing", state.copyAttachmentPathPopupHandler);
				}
				if (state.copyAttachmentPathCommandHandler && state.copyAttachmentPathCommand) {
					state.copyAttachmentPathCommand.removeEventListener("command", state.copyAttachmentPathCommandHandler);
				}
			if (state.InfoBox?.prototype.__zoteroKPanePatched) {
			const originals = state.InfoBox.prototype.__zoteroKPanePatched;
			state.InfoBox.prototype.render = originals.originalRender;
			state.InfoBox.prototype.destroy = originals.originalDestroy;
			delete state.InfoBox.prototype.__zoteroKPanePatched;
		}
		if (state.DuplicatesMergePane?.prototype.__zoteroKMergeGuarded) {
			const originals = state.DuplicatesMergePane.prototype.__zoteroKMergeGuarded;
			state.DuplicatesMergePane.prototype.setItems = originals.originalSetItems;
			state.DuplicatesMergePane.prototype.merge = originals.originalMerge;
			delete state.DuplicatesMergePane.prototype.__zoteroKMergeGuarded;
		}
		if (state.ItemPaneSidenav?.prototype.__zoteroKPaneSidenavPatched) {
			const originals = state.ItemPaneSidenav.prototype.__zoteroKPaneSidenavPatched;
			state.ItemPaneSidenav.prototype.render = originals.originalRender;
			state.ItemPaneSidenav.prototype.renderDefaultStatus = originals.originalRenderDefaultStatus;
			state.ItemPaneSidenav.prototype.updatePaneStatus = originals.originalUpdatePaneStatus;
			delete state.ItemPaneSidenav.prototype.__zoteroKPaneSidenavPatched;
		}

			state.copyAttachmentPathMenuItem?.remove();
			state.copyAttachmentPathKey?.remove();
				state.copyAttachmentPathCommand?.remove();
				state.style?.remove();
			this.windows.delete(win);
		},

	injectStyle(win) {
		const doc = win.document;
		let style = doc.getElementById("zotero-k-pane-style");
		if (style) {
			return style;
		}

		style = doc.createElementNS("http://www.w3.org/1999/xhtml", "link");
		style.id = "zotero-k-pane-style";
		style.rel = "stylesheet";
		style.href = "chrome://zys-pane/content/styles/pane.css";
		doc.documentElement.appendChild(style);
		return style;
	},

	restoreSidenavPaneButtons(win, sidenav) {
		if (!sidenav?.container?.getEnabledPane) {
			return;
		}

		for (const button of sidenav.querySelectorAll(".btn[data-pane]")) {
			const paneID = button.dataset.pane;
			if (!paneID || paneID === "context-notes") {
				continue;
			}

			let enabled = false;
			try {
				enabled = !!sidenav.container.getEnabledPane(paneID);
			}
			catch (_) {
				enabled = false;
			}
			if (!enabled) {
				continue;
			}

			if (button.parentElement) {
				button.parentElement.hidden = false;
			}
			button.removeAttribute("disabled");
		}
	},

	isTargetInfoBox(infoBox) {
		if (!infoBox || infoBox.id !== "zotero-editpane-info-box") {
			return false;
		}
		if (infoBox.mode === "merge" || infoBox.mode === "fieldmerge") {
			return false;
		}
		if (infoBox.closest?.("duplicates-merge-pane, merge-group, merge-pane")) {
			return false;
		}
		return true;
	},

		installCopyAttachmentPathCommand(win, patchState) {
			const doc = win.document;
			const menu = doc.getElementById("zotero-itemmenu");
			const commandSet = doc.getElementById("mainCommandSet");
			const keySet = doc.getElementById("mainKeyset");
			if (!menu || !commandSet || !keySet) {
				patchState.copyAttachmentPathRetryTimer = win.setTimeout(
					() => this.installCopyAttachmentPathCommand(win, patchState),
					250
				);
				return;
			}

			for (const id of [
				this.COPY_ATTACHMENT_PATH_MENU_ID,
				this.COPY_ATTACHMENT_PATH_KEY_ID,
				this.COPY_ATTACHMENT_PATH_COMMAND_ID,
			]) {
				doc.getElementById(id)?.remove();
			}

			const command = doc.createXULElement("command");
			command.id = this.COPY_ATTACHMENT_PATH_COMMAND_ID;
			const commandHandler = (event) => {
				event.preventDefault();
				event.stopPropagation();
				this.copySelectedAttachmentPaths(win).catch((err) => {
					this.reportCopyAttachmentPathError(win, err);
				});
			};
			command.addEventListener("command", commandHandler);
			commandSet.append(command);

			const key = doc.createXULElement("key");
			key.id = this.COPY_ATTACHMENT_PATH_KEY_ID;
			key.setAttribute("key", "c");
			key.setAttribute("modifiers", "accel alt");
			key.setAttribute("command", this.COPY_ATTACHMENT_PATH_COMMAND_ID);
			keySet.append(key);

			const menuItem = doc.createXULElement("menuitem");
			menuItem.id = this.COPY_ATTACHMENT_PATH_MENU_ID;
			menuItem.classList.add("menuitem-iconic");
			menuItem.setAttribute("label", "Copy Attachment Path");
			menuItem.setAttribute("key", this.COPY_ATTACHMENT_PATH_KEY_ID);
			menuItem.setAttribute("command", this.COPY_ATTACHMENT_PATH_COMMAND_ID);
			menu.append(menuItem);

			const popupHandler = () => this.updateCopyAttachmentPathCommandState(win);
			menu.addEventListener("popupshowing", popupHandler);

			patchState.copyAttachmentPathMenu = menu;
			patchState.copyAttachmentPathPopupHandler = popupHandler;
			patchState.copyAttachmentPathCommand = command;
			patchState.copyAttachmentPathCommandHandler = commandHandler;
			patchState.copyAttachmentPathKey = key;
			patchState.copyAttachmentPathMenuItem = menuItem;
			this.updateCopyAttachmentPathCommandState(win);
			win.Zotero.debug("Compact Pane: installed copy attachment path command");
		},

		updateCopyAttachmentPathCommandState(win) {
			const doc = win.document;
			const menuItem = doc.getElementById(this.COPY_ATTACHMENT_PATH_MENU_ID);
			const enabled = this.getSelectedZoteroItems(win).some((item) => this.canCopyAttachmentPathForItem(win, item));
			if (!menuItem) {
				return;
			}
			if (enabled) {
				menuItem.removeAttribute("disabled");
			}
			else {
				menuItem.setAttribute("disabled", "true");
			}
		},

		getSelectedZoteroItems(win) {
			try {
				return win.ZoteroPane?.getSelectedItems?.() || win.ZoteroPane_Local?.getSelectedItems?.() || [];
			}
			catch (err) {
				win.Zotero.debug(`Compact Pane: could not read selected items: ${err}`);
				return [];
			}
		},

		canCopyAttachmentPathForItem(win, item) {
			try {
				if (item?.isFileAttachment?.()) {
					return true;
				}
				if (!item?.isRegularItem?.()) {
					return false;
				}
				if (item.numFileAttachments?.() > 0) {
					return true;
				}
				return (item.getAttachments?.() || [])
					.map((id) => win.Zotero.Items.get(id))
					.some((attachment) => attachment?.isFileAttachment?.());
			}
			catch (_) {
				return false;
			}
		},

		async copySelectedAttachmentPaths(win) {
			const items = this.getSelectedZoteroItems(win);
			if (!items.length) {
				throw new Error("Select a Zotero item or attachment first.");
			}

			const paths = [];
			const seen = new Set();
			for (const item of items) {
				const path = await this.getBestAttachmentPathForItem(win, item);
				if (!path || seen.has(path)) {
					continue;
				}
				seen.add(path);
				paths.push(path);
			}

			if (!paths.length) {
				throw new Error("No selected item has an available local file attachment.");
			}

			this.copyStringToClipboard(paths.join("\n"));
			win.Zotero.debug(`Compact Pane: copied ${paths.length} attachment path${paths.length === 1 ? "" : "s"}`);
			this.updateCopyAttachmentPathCommandState(win);
		},

		async getBestAttachmentPathForItem(win, item) {
			const candidates = await this.getAttachmentPathCandidatesForItem(win, item);
			for (const attachment of candidates) {
				const path = await this.getAttachmentRealPath(attachment);
				if (path) {
					return path;
				}
			}
			return "";
		},

		async getAttachmentPathCandidatesForItem(win, item) {
			if (item?.isFileAttachment?.()) {
				return [item];
			}
			if (!item?.isRegularItem?.()) {
				return [];
			}

			try {
				const bestAttachments = await item.getBestAttachments?.();
				if (bestAttachments?.length) {
					return bestAttachments.filter((attachment) => attachment?.isFileAttachment?.());
				}
			}
			catch (err) {
				win.Zotero.debug(`Compact Pane: could not get best attachments: ${err}`);
			}

			try {
				return (item.getAttachments?.() || [])
					.map((id) => win.Zotero.Items.get(id))
					.filter((attachment) => attachment?.isFileAttachment?.())
					.sort((a, b) => {
						const aPDF = a.isPDFAttachment?.() ? 1 : 0;
						const bPDF = b.isPDFAttachment?.() ? 1 : 0;
						return bPDF - aPDF;
					});
			}
			catch (err) {
				win.Zotero.debug(`Compact Pane: could not get attachment candidates: ${err}`);
				return [];
			}
		},

		async getAttachmentRealPath(attachment) {
			try {
				return await attachment.getFilePathAsync();
			}
			catch (_) {
				try {
					return attachment.getFilePath();
				}
				catch (_) {
					return "";
				}
			}
		},

		copyStringToClipboard(text) {
			const clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
				.getService(Components.interfaces.nsIClipboardHelper);
			clipboard.copyString(text);
		},

		reportCopyAttachmentPathError(win, err) {
			const message = err instanceof Error ? err.message : String(err);
			win.Zotero.debug(`Compact Pane: copy attachment path failed: ${message}`);
			try {
				win.Zotero.alert(win, "Compact Pane", message);
			}
			catch (_) {
				win.alert(message);
			}
		},

	isExpanded(win) {
		return !!win.Zotero.Prefs.get(this.PREF_EXPANDED);
	},

	setExpanded(win, expanded) {
		win.Zotero.Prefs.set(this.PREF_EXPANDED, !!expanded);
	},

	getCompactFieldOrder(win, item) {
		if (!item) {
			return this.FALLBACK_COMPACT_FIELDS;
		}

		const itemType = win.Zotero.ItemTypes.getName(item.itemTypeID);
		const configuredFields = this.COMPACT_FIELD_ORDERS[itemType] || this.FALLBACK_COMPACT_FIELDS;
		const fields = [];
		const seen = new Set();

		for (const field of configuredFields) {
			const resolved = this.resolveCompactField(win, item, field);
			if (!resolved || seen.has(resolved)) {
				continue;
			}
			seen.add(resolved);
			fields.push(resolved);
		}

		return fields;
	},

	resolveCompactField(win, item, field) {
		if (!item?.itemTypeID || !field) {
			return "";
		}

		const itemType = win.Zotero.ItemTypes.getName(item.itemTypeID);
		const itemFields = win.Zotero.ItemFields;
		try {
			const fieldID = itemFields.getFieldIDFromTypeAndBase(itemType, field);
			return fieldID ? itemFields.getName(fieldID) : "";
		}
		catch (err) {
			win.Zotero.debug(`Compact Pane: skipped compact field ${field}: ${err}`);
			return "";
		}
	},

	applyInfoMode(win, infoBox) {
		const expanded = this.isExpanded(win);
		infoBox.toggleAttribute("zotero-k-expanded", expanded);

		if (expanded) {
			infoBox.fieldOrder = [];
			infoBox.visibleFields = [];
			return;
		}

		const fieldOrder = this.getCompactFieldOrder(win, infoBox.item);
		win.Zotero.debug(`Compact Pane: compact fields ${fieldOrder.join(", ")}`);
		infoBox.fieldOrder = fieldOrder;
		infoBox.visibleFields = fieldOrder;
	},

	ensureToggleButton(win, infoBox) {
		const section = infoBox.querySelector("collapsible-section");
		const head = section?._head || section?.querySelector(":scope > .head");
		const twisty = head?.querySelector(".twisty");
		if (!head || !twisty) {
			return;
		}

		let button = head.querySelector(".zotero-k-info-toggle");
		if (button) {
			return;
		}

		button = win.document.createXULElement("toolbarbutton");
		button.classList.add("add", "section-custom-button", "zotero-k-info-toggle");
		button.setAttribute("data-l10n-id", "section-button-add");
		button.setAttribute("tabindex", "0");

		const handler = (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.setExpanded(win, !this.isExpanded(win));
			this.applyInfoMode(win, infoBox);
			this.forceRender(infoBox);
		};

		button._zoteroKHandler = handler;
		button.addEventListener("command", handler);
		twisty.before(button);
	},

	updateToggleButton(win, infoBox) {
		const expanded = this.isExpanded(win);
		const button = infoBox.querySelector(".zotero-k-info-toggle");
		if (!button) {
			return;
		}

		button.classList.toggle("expanded", expanded);
		button.setAttribute(
			"tooltiptext",
			expanded ? "Show compact fields" : "Show all fields"
		);
		button.title = expanded ? "Show compact fields" : "Show all fields";
		button.setAttribute(
			"aria-label",
			expanded ? "Show compact fields" : "Show all fields"
		);
	},

	forceRender(infoBox) {
		if (typeof infoBox._forceRenderAll === "function") {
			infoBox._forceRenderAll();
			return;
		}
		if (typeof infoBox._resetRenderedFlags === "function") {
			infoBox._resetRenderedFlags();
		}
		infoBox.render();
	},
};

Zotero.ZoteroKPane = ZoteroKPane;
