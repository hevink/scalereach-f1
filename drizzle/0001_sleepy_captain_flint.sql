CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "workspace_invitation_email_status_idx" ON "workspace_invitation" USING btree ("email","status","workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_member_workspaceId_createdAt_idx" ON "workspace_member" USING btree ("workspace_id","created_at");