-- CreateTable
CREATE TABLE "gtfs_feed" (
    "feed_id" TEXT NOT NULL,
    "version_hash" TEXT,
    "fetched_at" TIMESTAMP(3),
    "loaded_at" TIMESTAMP(3),

    CONSTRAINT "gtfs_feed_pkey" PRIMARY KEY ("feed_id")
);

-- CreateTable
CREATE TABLE "agency" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "agency_id" TEXT,
    "agency_name" TEXT,
    "agency_url" TEXT,
    "agency_timezone" TEXT,

    CONSTRAINT "agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "stop_id" TEXT NOT NULL,
    "stop_name" TEXT,
    "stop_lat" DOUBLE PRECISION,
    "stop_lon" DOUBLE PRECISION,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "route_short_name" TEXT,
    "route_long_name" TEXT,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "route_id" TEXT,
    "service_id" TEXT,
    "trip_headsign" TEXT,
    "direction_id" INTEGER,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_times" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "stop_id" TEXT,
    "arrival_time" TEXT,
    "departure_time" TEXT,
    "stop_sequence" INTEGER,

    CONSTRAINT "stop_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "service_id" TEXT,
    "monday" INTEGER,
    "tuesday" INTEGER,
    "wednesday" INTEGER,
    "thursday" INTEGER,
    "friday" INTEGER,
    "saturday" INTEGER,
    "sunday" INTEGER,
    "start_date" TEXT,
    "end_date" TEXT,

    CONSTRAINT "calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_dates" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "service_id" TEXT,
    "date" TEXT,
    "exception_type" INTEGER,

    CONSTRAINT "calendar_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shapes" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "shape_id" TEXT,
    "shape_pt_lat" DOUBLE PRECISION,
    "shape_pt_lon" DOUBLE PRECISION,
    "shape_pt_sequence" INTEGER,

    CONSTRAINT "shapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_positions" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "route_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "bearing" DOUBLE PRECISION,
    "ingested_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latest_vehicle_positions" (
    "id" SERIAL NOT NULL,
    "feed_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "route_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "bearing" DOUBLE PRECISION,
    "ingested_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "latest_vehicle_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agency_feed_id_idx" ON "agency"("feed_id");

-- CreateIndex
CREATE INDEX "stops_feed_id_idx" ON "stops"("feed_id");

-- CreateIndex
CREATE INDEX "stops_feed_id_stop_id_idx" ON "stops"("feed_id", "stop_id");

-- CreateIndex
CREATE INDEX "routes_feed_id_idx" ON "routes"("feed_id");

-- CreateIndex
CREATE INDEX "routes_feed_id_route_id_idx" ON "routes"("feed_id", "route_id");

-- CreateIndex
CREATE INDEX "trips_feed_id_idx" ON "trips"("feed_id");

-- CreateIndex
CREATE INDEX "trips_feed_id_trip_id_idx" ON "trips"("feed_id", "trip_id");

-- CreateIndex
CREATE INDEX "stop_times_feed_id_idx" ON "stop_times"("feed_id");

-- CreateIndex
CREATE INDEX "stop_times_feed_id_stop_id_idx" ON "stop_times"("feed_id", "stop_id");

-- CreateIndex
CREATE INDEX "stop_times_feed_id_trip_id_idx" ON "stop_times"("feed_id", "trip_id");

-- CreateIndex
CREATE INDEX "stop_times_stop_id_idx" ON "stop_times"("stop_id");

-- CreateIndex
CREATE INDEX "calendar_feed_id_idx" ON "calendar"("feed_id");

-- CreateIndex
CREATE INDEX "calendar_dates_feed_id_idx" ON "calendar_dates"("feed_id");

-- CreateIndex
CREATE INDEX "shapes_feed_id_idx" ON "shapes"("feed_id");

-- CreateIndex
CREATE INDEX "vehicle_positions_feed_id_idx" ON "vehicle_positions"("feed_id");

-- CreateIndex
CREATE INDEX "vehicle_positions_feed_id_vehicle_id_idx" ON "vehicle_positions"("feed_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_positions_feed_id_timestamp_idx" ON "vehicle_positions"("feed_id", "timestamp");

-- CreateIndex
CREATE INDEX "vehicle_positions_timestamp_idx" ON "vehicle_positions"("timestamp");

-- CreateIndex
CREATE INDEX "latest_vehicle_positions_feed_id_idx" ON "latest_vehicle_positions"("feed_id");

-- CreateIndex
CREATE INDEX "latest_vehicle_positions_feed_id_vehicle_id_idx" ON "latest_vehicle_positions"("feed_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "latest_vehicle_positions_timestamp_idx" ON "latest_vehicle_positions"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "latest_vehicle_positions_feed_id_vehicle_id_key" ON "latest_vehicle_positions"("feed_id", "vehicle_id");
