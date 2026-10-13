CREATE TABLE `course_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseSlug` varchar(96) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`source` varchar(64) NOT NULL DEFAULT 'stripe_checkout',
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_access_user_course_unique` UNIQUE(`userId`,`courseSlug`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseSlug` varchar(96) NOT NULL,
	`lessonId` varchar(96) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_user_lesson_unique` UNIQUE(`userId`,`courseSlug`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseSlug` varchar(96) NOT NULL,
	`stripeCheckoutSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amountCents` int NOT NULL,
	`currency` varchar(12) NOT NULL,
	`status` varchar(32) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_checkout_session_unique` UNIQUE(`stripeCheckoutSessionId`)
);
--> statement-breakpoint
CREATE TABLE `processed_stripe_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeEventId` varchar(255) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processed_stripe_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_event_unique` UNIQUE(`stripeEventId`)
);
--> statement-breakpoint
CREATE INDEX `course_access_user_idx` ON `course_access` (`userId`);--> statement-breakpoint
CREATE INDEX `lesson_progress_user_idx` ON `lesson_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `payments_user_idx` ON `payments` (`userId`);