CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"identifier" text,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "workspace_member_workspaceId_userId_idx";--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_workspaceId_idx" ON "team" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "team_workspaceId_createdAt_idx" ON "team" USING btree ("workspace_id","created_at");--> statement-breakpoint
ALTER TABLE "workspace" DROP COLUMN "timezone";--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspaceId_userId_unique" UNIQUE("workspace_id","user_id");