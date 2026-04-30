ALTER TABLE `form_events` ADD `field_id` text;--> statement-breakpoint
ALTER TABLE `form_events` ADD `session_id` text;--> statement-breakpoint
CREATE INDEX `form_events_session_idx` ON `form_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `form_events_field_idx` ON `form_events` (`field_id`);--> statement-breakpoint
ALTER TABLE `form_responses` ADD `respondent_email` text;--> statement-breakpoint
ALTER TABLE `forms` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `forms` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `forms` ADD `response_limit` integer;--> statement-breakpoint
ALTER TABLE `forms` ADD `collect_email` integer DEFAULT false NOT NULL;