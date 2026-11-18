CREATE TABLE "assistant_questions" (
	"visitor" text NOT NULL,
	"day" date NOT NULL,
	"asked" integer NOT NULL,
	CONSTRAINT "assistant_questions_visitor_day_pk" PRIMARY KEY("visitor","day")
);
