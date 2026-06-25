--
-- PostgreSQL database dump
--

\restrict 4WkgMf7Fkc3hFaxRZ25qXMrwhTLo5y6fk4BLkXWd6n0eFSKIHmHI4b2gReKYWo2

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."VideoProgress" DROP CONSTRAINT IF EXISTS "VideoProgress_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."VideoProgress" DROP CONSTRAINT IF EXISTS "VideoProgress_lessonId_fkey";
ALTER TABLE IF EXISTS ONLY public."UserCourseAccess" DROP CONSTRAINT IF EXISTS "UserCourseAccess_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."UserCourseAccess" DROP CONSTRAINT IF EXISTS "UserCourseAccess_courseId_fkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_courseId_fkey";
ALTER TABLE IF EXISTS ONLY public."Lesson" DROP CONSTRAINT IF EXISTS "Lesson_courseId_fkey";
ALTER TABLE IF EXISTS ONLY public."Chapter" DROP CONSTRAINT IF EXISTS "Chapter_courseId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorUserId_fkey";
DROP INDEX IF EXISTS public."VideoProgress_userId_lessonId_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."UserCourseAccess_userId_courseId_key";
DROP INDEX IF EXISTS public."UserCourseAccess_courseId_idx";
DROP INDEX IF EXISTS public."Subject_name_classLabel_key";
DROP INDEX IF EXISTS public."Subject_code_key";
DROP INDEX IF EXISTS public."Subject_classLabel_idx";
DROP INDEX IF EXISTS public."RefreshToken_userId_idx";
DROP INDEX IF EXISTS public."RefreshToken_tokenHash_key";
DROP INDEX IF EXISTS public."Payment_razorpayWebhookEventId_key";
DROP INDEX IF EXISTS public."Payment_razorpayPaymentId_key";
DROP INDEX IF EXISTS public."Payment_orderId_idx";
DROP INDEX IF EXISTS public."Order_userId_idx";
DROP INDEX IF EXISTS public."Order_receipt_key";
DROP INDEX IF EXISTS public."Order_razorpayPaymentId_key";
DROP INDEX IF EXISTS public."Order_razorpayOrderId_key";
DROP INDEX IF EXISTS public."Order_courseId_idx";
DROP INDEX IF EXISTS public."Lesson_courseId_slug_key";
DROP INDEX IF EXISTS public."Lesson_courseId_orderIndex_key";
DROP INDEX IF EXISTS public."Lesson_courseId_idx";
DROP INDEX IF EXISTS public."Lesson_chapterTitle_idx";
DROP INDEX IF EXISTS public."Course_subject_idx";
DROP INDEX IF EXISTS public."Course_status_idx";
DROP INDEX IF EXISTS public."Course_slug_key";
DROP INDEX IF EXISTS public."Course_code_key";
DROP INDEX IF EXISTS public."Course_classLabel_idx";
DROP INDEX IF EXISTS public."Course_classId_idx";
DROP INDEX IF EXISTS public."ClassLevel_orderIndex_idx";
DROP INDEX IF EXISTS public."ClassLevel_name_key";
DROP INDEX IF EXISTS public."ClassLevel_code_key";
DROP INDEX IF EXISTS public."Chapter_subject_idx";
DROP INDEX IF EXISTS public."Chapter_courseId_idx";
DROP INDEX IF EXISTS public."Chapter_code_key";
DROP INDEX IF EXISTS public."Chapter_classLabel_idx";
DROP INDEX IF EXISTS public."AuditLog_entityType_entityId_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."VideoProgress" DROP CONSTRAINT IF EXISTS "VideoProgress_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserCourseAccess" DROP CONSTRAINT IF EXISTS "UserCourseAccess_pkey";
ALTER TABLE IF EXISTS ONLY public."Subject" DROP CONSTRAINT IF EXISTS "Subject_pkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_pkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."Lesson" DROP CONSTRAINT IF EXISTS "Lesson_pkey";
ALTER TABLE IF EXISTS ONLY public."Course" DROP CONSTRAINT IF EXISTS "Course_pkey";
ALTER TABLE IF EXISTS ONLY public."ClassLevel" DROP CONSTRAINT IF EXISTS "ClassLevel_pkey";
ALTER TABLE IF EXISTS ONLY public."Chapter" DROP CONSTRAINT IF EXISTS "Chapter_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."VideoProgress";
DROP TABLE IF EXISTS public."UserCourseAccess";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Subject";
DROP TABLE IF EXISTS public."RefreshToken";
DROP TABLE IF EXISTS public."Payment";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."Lesson";
DROP TABLE IF EXISTS public."Course";
DROP TABLE IF EXISTS public."ClassLevel";
DROP TABLE IF EXISTS public."Chapter";
DROP TABLE IF EXISTS public."AuditLog";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."PaymentStatus";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."CourseStatus";
DROP TYPE IF EXISTS public."AccessSource";
--
-- Name: AccessSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessSource" AS ENUM (
    'PURCHASE',
    'MANUAL',
    'PROMOTIONAL'
);


--
-- Name: CourseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CourseStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'CREATED',
    'PAID',
    'FAILED',
    'REFUNDED'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'CREATED',
    'VERIFIED',
    'FAILED',
    'REFUNDED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorUserId" text,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "metadataJson" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Chapter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chapter" (
    id text NOT NULL,
    code text,
    title text NOT NULL,
    "classLabel" text,
    subject text,
    "courseId" text,
    "orderIndex" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ClassLevel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClassLevel" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    "orderIndex" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Course; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Course" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    "thumbnailUrl" text,
    "priceInPaise" integer NOT NULL,
    status public."CourseStatus" DEFAULT 'DRAFT'::public."CourseStatus" NOT NULL,
    "shortDescription" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    code text,
    "classId" text,
    "classLabel" text,
    subject text,
    color text,
    emoji text,
    tagline text,
    "studentsLabel" text,
    "featuresJson" jsonb
);


--
-- Name: Lesson; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lesson" (
    id text NOT NULL,
    "courseId" text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    "orderIndex" integer NOT NULL,
    "durationSeconds" integer,
    "isPreview" boolean DEFAULT false NOT NULL,
    "bunnyVideoId" text,
    "bunnyEmbedUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    code text,
    "chapterTitle" text,
    "chapterIndex" integer,
    "thumbnailUrl" text,
    "priceInPaise" integer,
    "viewsLabel" text,
    "ratingLabel" text
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    "razorpayOrderId" text NOT NULL,
    "razorpayPaymentId" text,
    "amountInPaise" integer NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    status public."OrderStatus" DEFAULT 'CREATED'::public."OrderStatus" NOT NULL,
    receipt text,
    "notesJson" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "razorpayPaymentId" text,
    "razorpaySignature" text,
    "razorpayWebhookEventId" text,
    status public."PaymentStatus" DEFAULT 'CREATED'::public."PaymentStatus" NOT NULL,
    "amountInPaise" integer NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    method text,
    "payloadJson" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp(3) without time zone
);


--
-- Name: Subject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subject" (
    id text NOT NULL,
    code text,
    name text NOT NULL,
    "classLabel" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    phone text,
    "gradeLabel" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UserCourseAccess; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserCourseAccess" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    source public."AccessSource" DEFAULT 'PURCHASE'::public."AccessSource" NOT NULL,
    "grantedByUserId" text,
    "orderId" text,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


--
-- Name: VideoProgress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VideoProgress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "lessonId" text NOT NULL,
    "watchedSeconds" integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "lastWatchedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "actorUserId", action, "entityType", "entityId", "metadataJson", "createdAt") FROM stdin;
\.


--
-- Data for Name: Chapter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Chapter" (id, code, title, "classLabel", subject, "courseId", "orderIndex", "createdAt", "updatedAt") FROM stdin;
cmqtbc9sk0005nq3u0y0efk4w	CHP-G1-MATH-001	Chapter 1: Numbers 1-100	Grade 1	Mathematics	cmqt9ewjx0001ms2m018u1wle	1	2026-06-25 09:41:58.293	2026-06-25 09:41:58.293
cmqtbc9sr0009nq3u37p5u5ru	CHP-G1-MATH-002	Chapter 2: Addition	Grade 1	Mathematics	cmqt9ewjx0001ms2m018u1wle	2	2026-06-25 09:41:58.3	2026-06-25 09:41:58.3
cmqtbkfxb000bnq0141x28xou	CHP-G2-MATH-001	Chapter 1: Subtraction	Grade 2	Mathematics	cmqtbjs9k0009nq01cdfhrutz	3	2026-06-25 09:48:19.487	2026-06-25 09:48:45.822
\.


--
-- Data for Name: ClassLevel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ClassLevel" (id, code, name, "orderIndex", "createdAt", "updatedAt") FROM stdin;
cmqtbc9sf0002nq3u5nmh5dr6	CLS-G1	Grade 1	1	2026-06-25 09:41:58.288	2026-06-25 09:41:58.288
cmqtbhbn70007nq0149p6rzmy	CLS-G2	Grade 2	2	2026-06-25 09:45:53.971	2026-06-25 09:45:53.971
cmqthjxur000nnq0108oeo7p0	CLS1	Class 1	1	2026-06-25 12:35:53.763	2026-06-25 12:35:53.763
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Course" (id, title, slug, description, "thumbnailUrl", "priceInPaise", status, "shortDescription", "createdAt", "updatedAt", code, "classId", "classLabel", subject, color, emoji, tagline, "studentsLabel", "featuresJson") FROM stdin;
cmqt9ewjx0001ms2m018u1wle	Grade 1 Mathematics Foundation	grade-1-mathematics-foundation	Foundation math course for Grade 1 students.	https://images.unsplash.com/photo-1503676260728-1c00da094a0b	49900	PUBLISHED	Core arithmetic, counting, and problem solving.	2026-06-25 08:48:01.869	2026-06-25 09:41:58.284	CRS-G1-MATH	class1	Grade 1	Mathematics	#c084fc	🚀	Igniting curiosity	3.2k	["All mathematics lessons", "HD video access", "Notes and worksheets"]
cmqtbjs9k0009nq01cdfhrutz	Grade 2 Mathematics Foundation	grade-2-mathematics-foundation	Grade 2 Mathematics Foundation for Grade 2.	\N	49900	PUBLISHED	Mathematics course	2026-06-25 09:47:48.824	2026-06-25 09:47:48.824	CRS-G2-MATH	class2	Grade 2	Mathematics	#c084fc	📚	Mathematics learning path	\N	["HD video lessons", "Notes and worksheets"]
\.


--
-- Data for Name: Lesson; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Lesson" (id, "courseId", title, slug, description, "orderIndex", "durationSeconds", "isPreview", "bunnyVideoId", "bunnyEmbedUrl", "createdAt", "updatedAt", code, "chapterTitle", "chapterIndex", "thumbnailUrl", "priceInPaise", "viewsLabel", "ratingLabel") FROM stdin;
cmqt9ewk40005ms2mqbgw3era	cmqt9ewjx0001ms2m018u1wle	Addition Basics	addition-basics	\N	2	540	f	\N	\N	2026-06-25 08:48:01.876	2026-06-25 09:41:58.302	LES-G1-MATH-002	Chapter 2: Addition	2	https://picsum.photos/seed/g1mathaddition/400/225	1900	1.7k	4.9
cmqtby2jy000dnq01pdmzarnb	cmqtbjs9k0009nq01cdfhrutz	Subtraction Basics	subtraction-basics	Subtraction Basics lesson	1	\N	f	\N	\N	2026-06-25 09:58:55.342	2026-06-25 10:00:06.436	LES-G2-MATH-001	Chapter 1: Subtraction	1	\N	49900	\N	\N
cmqt9ewk00003ms2m8axwsdz6	cmqt9ewjx0001ms2m018u1wle	Counting to 100	counting-to-100	\N	1	420	t	80ca9cc0-8ca1-4d20-8d6b-686c00e97f86	https://iframe.mediadelivery.net/embed/691065/80ca9cc0-8ca1-4d20-8d6b-686c00e97f86	2026-06-25 08:48:01.873	2026-06-25 09:41:58.297	LES-G1-MATH-001	Chapter 1: Numbers 1-100	1	https://vz-6b37fffa-0df.b-cdn.net/80ca9cc0-8ca1-4d20-8d6b-686c00e97f86/thumbnail.jpg	1900	1.2k	4.8
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, "userId", "courseId", "razorpayOrderId", "razorpayPaymentId", "amountInPaise", currency, status, receipt, "notesJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "orderId", "razorpayPaymentId", "razorpaySignature", "razorpayWebhookEventId", status, "amountInPaise", currency, method, "payloadJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RefreshToken" (id, "userId", "tokenHash", "expiresAt", "createdAt", "revokedAt") FROM stdin;
\.


--
-- Data for Name: Subject; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subject" (id, code, name, "classLabel", "createdAt", "updatedAt") FROM stdin;
cmqtbc9si0003nq3uogtychmk	SUB-G1-MATH	Mathematics	Grade 1	2026-06-25 09:41:58.29	2026-06-25 09:41:58.29
cmqtbhy0v0008nq01wdz6n6er	SUB-G2-MATH	Mathematics	Grade 2	2026-06-25 09:46:22.976	2026-06-25 09:46:22.976
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, "passwordHash", role, phone, "gradeLabel", "isActive", "createdAt", "updatedAt") FROM stdin;
cmqt9ewjq0000ms2mqtk5wtat	Admin User	admin@drmom.local	$2b$12$.BUb9kuzHE6BIwxpmsUY3.rJy0QaWb1nEH4qMyNR6gabifKkDUhUW	ADMIN	\N	\N	t	2026-06-25 08:48:01.862	2026-06-25 09:41:58.276
\.


--
-- Data for Name: UserCourseAccess; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserCourseAccess" (id, "userId", "courseId", source, "grantedByUserId", "orderId", "grantedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: VideoProgress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VideoProgress" (id, "userId", "lessonId", "watchedSeconds", completed, "lastWatchedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3673b21c-6cb6-4eb0-8329-16657440af77	de7398523b32d1281048ae61e4db98ef005e6d2454e117778061d123971f15ac	2026-06-25 08:47:49.441763+00	0001_init	\N	\N	2026-06-25 08:47:49.33753+00	1
f353cd6e-afcd-426c-aeec-524bc362189c	0a8ea947938a8b7e987d7d63185b2dcfe117bb1e439c6d48dc3a7c28a9501484	2026-06-25 08:57:38.189564+00	0002_frontend_catalog_fields	\N	\N	2026-06-25 08:57:37.719732+00	1
14c66f06-62e9-43a5-8278-9a7c14f7812d	f31d923d03eb7de044d62f27ee49934224ad3f34720ebc63ffc9a8b2fa00ee2a	2026-06-25 09:41:57.715403+00	0003_admin_metadata	\N	\N	2026-06-25 09:41:57.672593+00	1
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Chapter Chapter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chapter"
    ADD CONSTRAINT "Chapter_pkey" PRIMARY KEY (id);


--
-- Name: ClassLevel ClassLevel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassLevel"
    ADD CONSTRAINT "ClassLevel_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: Lesson Lesson_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: Subject Subject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_pkey" PRIMARY KEY (id);


--
-- Name: UserCourseAccess UserCourseAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserCourseAccess"
    ADD CONSTRAINT "UserCourseAccess_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VideoProgress VideoProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoProgress"
    ADD CONSTRAINT "VideoProgress_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: Chapter_classLabel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Chapter_classLabel_idx" ON public."Chapter" USING btree ("classLabel");


--
-- Name: Chapter_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Chapter_code_key" ON public."Chapter" USING btree (code);


--
-- Name: Chapter_courseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Chapter_courseId_idx" ON public."Chapter" USING btree ("courseId");


--
-- Name: Chapter_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Chapter_subject_idx" ON public."Chapter" USING btree (subject);


--
-- Name: ClassLevel_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClassLevel_code_key" ON public."ClassLevel" USING btree (code);


--
-- Name: ClassLevel_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClassLevel_name_key" ON public."ClassLevel" USING btree (name);


--
-- Name: ClassLevel_orderIndex_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClassLevel_orderIndex_idx" ON public."ClassLevel" USING btree ("orderIndex");


--
-- Name: Course_classId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Course_classId_idx" ON public."Course" USING btree ("classId");


--
-- Name: Course_classLabel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Course_classLabel_idx" ON public."Course" USING btree ("classLabel");


--
-- Name: Course_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Course_code_key" ON public."Course" USING btree (code);


--
-- Name: Course_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Course_slug_key" ON public."Course" USING btree (slug);


--
-- Name: Course_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Course_status_idx" ON public."Course" USING btree (status);


--
-- Name: Course_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Course_subject_idx" ON public."Course" USING btree (subject);


--
-- Name: Lesson_chapterTitle_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lesson_chapterTitle_idx" ON public."Lesson" USING btree ("chapterTitle");


--
-- Name: Lesson_courseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lesson_courseId_idx" ON public."Lesson" USING btree ("courseId");


--
-- Name: Lesson_courseId_orderIndex_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Lesson_courseId_orderIndex_key" ON public."Lesson" USING btree ("courseId", "orderIndex");


--
-- Name: Lesson_courseId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Lesson_courseId_slug_key" ON public."Lesson" USING btree ("courseId", slug);


--
-- Name: Order_courseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_courseId_idx" ON public."Order" USING btree ("courseId");


--
-- Name: Order_razorpayOrderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON public."Order" USING btree ("razorpayOrderId");


--
-- Name: Order_razorpayPaymentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Order_razorpayPaymentId_key" ON public."Order" USING btree ("razorpayPaymentId");


--
-- Name: Order_receipt_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Order_receipt_key" ON public."Order" USING btree (receipt);


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: Payment_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payment_orderId_idx" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_razorpayPaymentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON public."Payment" USING btree ("razorpayPaymentId");


--
-- Name: Payment_razorpayWebhookEventId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_razorpayWebhookEventId_key" ON public."Payment" USING btree ("razorpayWebhookEventId");


--
-- Name: RefreshToken_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON public."RefreshToken" USING btree ("tokenHash");


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: Subject_classLabel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subject_classLabel_idx" ON public."Subject" USING btree ("classLabel");


--
-- Name: Subject_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subject_code_key" ON public."Subject" USING btree (code);


--
-- Name: Subject_name_classLabel_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subject_name_classLabel_key" ON public."Subject" USING btree (name, "classLabel");


--
-- Name: UserCourseAccess_courseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserCourseAccess_courseId_idx" ON public."UserCourseAccess" USING btree ("courseId");


--
-- Name: UserCourseAccess_userId_courseId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserCourseAccess_userId_courseId_key" ON public."UserCourseAccess" USING btree ("userId", "courseId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VideoProgress_userId_lessonId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VideoProgress_userId_lessonId_key" ON public."VideoProgress" USING btree ("userId", "lessonId");


--
-- Name: AuditLog AuditLog_actorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Chapter Chapter_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chapter"
    ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lesson Lesson_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserCourseAccess UserCourseAccess_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserCourseAccess"
    ADD CONSTRAINT "UserCourseAccess_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserCourseAccess UserCourseAccess_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserCourseAccess"
    ADD CONSTRAINT "UserCourseAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VideoProgress VideoProgress_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoProgress"
    ADD CONSTRAINT "VideoProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VideoProgress VideoProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoProgress"
    ADD CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 4WkgMf7Fkc3hFaxRZ25qXMrwhTLo5y6fk4BLkXWd6n0eFSKIHmHI4b2gReKYWo2

