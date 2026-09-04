CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent` text NOT NULL,
	`message` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `business_snapshots` (
	`id` integer PRIMARY KEY NOT NULL,
	`revenue` real NOT NULL,
	`orders` integer NOT NULL,
	`net_profit` real NOT NULL,
	`rating` real NOT NULL,
	`revenue_change` real NOT NULL,
	`orders_change` real NOT NULL,
	`profit_change` real NOT NULL,
	`rating_change` real NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'demo' NOT NULL,
	`last_sync_at` text
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`agent` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`impact` text NOT NULL,
	`confidence` integer NOT NULL,
	`priority` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source` text DEFAULT 'agent' NOT NULL,
	`created_at` text NOT NULL,
	`actioned_at` text
);
