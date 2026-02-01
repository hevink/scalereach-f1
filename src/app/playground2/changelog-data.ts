export type ChangelogItemType = "new" | "updated" | "fixed" | "removed";

export interface ChangelogItem {
	type: ChangelogItemType;
	text: string;
}

export interface ChangelogSection {
	title: string;
	items: ChangelogItem[];
}

export interface ChangelogEntry {
	version: string;
	date: string;
	title: string;
	sections: ChangelogSection[];
}

export const changelogEntries: ChangelogEntry[] = [
	{
		version: "v0.2.0",
		date: "2026-01-31",
		title: "AI-powered clip detection and improved export quality",
		sections: [
			{
				title: "Clip Generation",
				items: [
					{ type: "new", text: "AI-powered viral moment detection for automatic clip suggestions" },
					{ type: "updated", text: "Improved clip boundary detection for smoother cuts" },
					{ type: "fixed", text: "Fixed audio sync issues in exported clips" },
				],
			},
			{
				title: "Export",
				items: [
					{ type: "new", text: "Support for 4K export resolution" },
					{ type: "updated", text: "Faster export processing with parallel encoding" },
					{ type: "fixed", text: "Fixed caption rendering issues on certain aspect ratios" },
				],
			},
			{
				title: "Bug Fixes",
				items: [
					{ type: "fixed", text: "Fixed timeline scrubbing lag on longer videos" },
					{ type: "fixed", text: "Resolved memory leak when processing multiple projects" },
				],
			},
		],
	},
	{
		version: "v0.1.5",
		date: "2026-01-15",
		title: "Caption styling and workspace improvements",
		sections: [
			{
				title: "Captions",
				items: [
					{ type: "new", text: "Custom caption style presets with save/load functionality" },
					{ type: "new", text: "Word-by-word highlight animation option" },
					{ type: "updated", text: "Improved caption positioning controls" },
				],
			},
			{
				title: "Workspace",
				items: [
					{ type: "new", text: "Team workspace support with member invitations" },
					{ type: "updated", text: "Better project organization with folders" },
					{ type: "fixed", text: "Fixed project duplication issues" },
				],
			},
		],
	},
	{
		version: "v0.1.0",
		date: "2026-01-01",
		title: "Initial release with core video editing features",
		sections: [
			{
				title: "Core Features",
				items: [
					{ type: "new", text: "Video upload and transcription with Deepgram" },
					{ type: "new", text: "Automatic clip detection based on transcript" },
					{ type: "new", text: "Caption overlay with customizable styles" },
					{ type: "new", text: "Export to multiple aspect ratios (16:9, 9:16, 1:1)" },
				],
			},
			{
				title: "Editor",
				items: [
					{ type: "new", text: "Timeline-based video editor" },
					{ type: "new", text: "Transcript editing with timing preservation" },
					{ type: "new", text: "Keyboard shortcuts for efficient editing" },
				],
			},
		],
	},
];
