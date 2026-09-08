CREATE TABLE "wgotalent_usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(80) NOT NULL,
	"password_hash" text NOT NULL,
	"password_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "wgotalent_usuarios_username_unique" UNIQUE("username")
);
--> statement-breakpoint
INSERT INTO "wgotalent_usuarios" ("username", "password_hash")
VALUES (
	'admin',
	'scrypt$hQirjWrK-vjETUDqu9hxBw$4XU1pLT49jp24IhZUFf5ySzRaB236q2E5S6684xaeU6T32kTO2xgz9r9P4sTBoIVBRSxxNfXqukbg9GYztJDuQ'
)
ON CONFLICT ("username") DO NOTHING;
