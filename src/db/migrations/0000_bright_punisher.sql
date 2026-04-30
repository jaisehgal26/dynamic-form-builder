CREATE TABLE `form_events` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`event_type` text NOT NULL,
	`step` integer,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_events_form_idx` ON `form_events` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_events_type_idx` ON `form_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `form_events_created_idx` ON `form_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `form_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`placeholder` text,
	`required` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`step` integer DEFAULT 1 NOT NULL,
	`config_json` text DEFAULT '{}' NOT NULL,
	`validation_json` text DEFAULT '{}' NOT NULL,
	`logic_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_fields_form_idx` ON `form_fields` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_fields_form_pos_idx` ON `form_fields` (`form_id`,`position`);--> statement-breakpoint
CREATE TABLE `form_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`respondent_id` text,
	`answers_json` text DEFAULT '{}' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`started_at` integer,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completion_time_seconds` integer,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_responses_form_idx` ON `form_responses` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_responses_submitted_idx` ON `form_responses` (`submitted_at`);--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`schema_json` text DEFAULT '{}' NOT NULL,
	`theme_json` text DEFAULT '{}' NOT NULL,
	`settings_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forms_slug_idx` ON `forms` (`slug`);--> statement-breakpoint
CREATE INDEX `forms_user_idx` ON `forms` (`user_id`);--> statement-breakpoint
CREATE INDEX `forms_status_idx` ON `forms` (`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);