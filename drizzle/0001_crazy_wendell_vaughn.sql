CREATE TABLE `analysis_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`analysisType` enum('structure','glossary','tags','access','lineage','security') NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`resultData` json,
	`recommendations` json,
	`gaps` json,
	`score` float,
	`executionMs` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analysis_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`databricksHost` varchar(512) NOT NULL,
	`targetCatalog` varchar(256) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`governanceScore` float,
	`totalCatalogs` int,
	`totalSchemas` int,
	`totalTables` int,
	`docCoverage` float,
	`tagCoverage` float,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audit_sessions_id` PRIMARY KEY(`id`)
);
