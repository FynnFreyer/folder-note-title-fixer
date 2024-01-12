import { Plugin } from 'obsidian';

let name = 'folder-note-title-fixer'

export default class FolderNoteTitleFixerPlugin extends Plugin {

	/**
	 * This will do the actual work of fixing the displayed titles.
	 */
	onActiveLeafChange() {
		console.log(`${name}: fixing titles`)
	}

	async onload() {
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", this.onActiveLeafChange),
			);
			console.log(`${name}: plugin loaded`);
		});
	}

	onunload() {
		console.log(`${name}: plugin unloaded`);
	}
}
