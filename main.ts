import {Notice, Platform, Plugin, WorkspaceLeaf} from 'obsidian'
import {isPluginEnabled} from "@aidenlx/folder-note-core";
import {NoteLoc} from "@aidenlx/folder-note-core/lib/typings/api";

const name = 'folder-note-title-fixer'


export default class FolderNoteTitleFixerPlugin extends Plugin {
	/**
	 * The path separator on this system. Used for splitting paths and as visual indicator.
	 * @type string sep - The path separator on this system.
	 */
	sep: string = "/"

	/**
	 * Load the app. Called on startup or when enabling the plugin.
	 */
	async onload() {
		if (Platform.isWin)
			this.sep = '\\'

		// TODO improvement: hook into folder-note:api-ready event to activate the extension
		// bail if folder-note-core is unavailable
		if (!isPluginEnabled(this)) {
			const message = `${name}: folder-note-core is unavailable, aborting ...`
			new Notice(message);
			throw new Error(message);
		}

		// TODO improvement: hook into folder-note:cfg-changed event to de-/activate the extension
		if (!this.folderNotePrefIsIndex) {
			const message = `${name}: folder-note-core isn't using the indexed storage strategy, aborting ...`
			new Notice(message);
			throw new Error(message);
		}

		// we need to wait until the layout is ready to register our hook
		this.app.workspace.onLayoutReady(() => {
			// correct tab titles once in the beginning
			this.app.workspace.iterateAllLeaves(leaf => this.fixFolderNoteTitles(leaf))
			console.log(`${name}: initial title fix applied`)

			// TODO: active-leaf-change feels like a somewhat poor proxy for what I'm interested in
			// register our fix to run on every page change event
			this.registerEvent(
				// @ts-ignore
				this.app.workspace.on("active-leaf-change", leaf => {
					console.debug(`${name}: active leaf changed`)
					if (leaf !== null)
						this.fixFolderNoteTitles(leaf)
				}),
			);
		});

		console.log(`${name}: plugin loaded`);
	}

	/**
	 * Unload the app. Called when disabling the plugin.
	 */
	onunload() {
		console.log(`${name}: plugin unloaded`);
	}

	/**
	 * This tells us, whether folder notes follow the index file inside folder strategy.
	 */
	get folderNotePrefIsIndex(): boolean {
		// @ts-ignore TODO: a better mechanism for reading the folder-note-core settings is needed
		return this.app.plugins.plugins["folder-note-core"]?.settings?.folderNotePref === NoteLoc.Index
	}

	/**
	 * This tells us the name used for index files.
	 */
	get indexName(): string | undefined {
		// @ts-ignore don't mind me, this is JUST fine =) TODO: actually, this kinda sucks
		return this.app.plugins.plugins["folder-note-core"]?.settings?.indexName
	}

	/**
	 * This does the actual fixing of the displayed folder note titles.
	 *
	 * @param {WorkspaceLeaf} leaf - The current editor view.
	 */
	fixFolderNoteTitles(leaf: WorkspaceLeaf) {
		// exit early if getViewState is undefined
		if (typeof leaf.getViewState === "undefined")
			return

		const viewState = leaf.getViewState()
		const fileName: string | undefined = viewState.state.file

		// @ts-ignore don't mind me, this is JUST fine =)  // TODO: actually, this kinda sucks
		// const indexName = app.plugins.plugins["folder-note-core"]?.settings?.indexName

		// only work on markdown notes with the appropriate name for folder notes
		if (viewState.type !== "markdown"
			|| typeof fileName === "undefined"  // this shouldn't happen if we have type markdown, but let's be safe
			|| !fileName.endsWith(`/${this.indexName}.md`))
			return

		// get the name of the containing folder
		const parents = fileName.split(this.sep).slice(0, -1)
		const parent = parents.at(-1) + this.sep  // keep trailing seperator as visual indicator

		// and set the title if necessary
		// @ts-ignore
		if (leaf.tabHeaderInnerTitleEl.getText() !== parent) {
			// @ts-ignore
			leaf.tabHeaderInnerTitleEl.setText(parent)
			// @ts-ignore
			leaf.tabHeaderEl.ariaLabel = parent
			console.log(`${name}: fixed title for ${fileName}`)
		}
	}
}
