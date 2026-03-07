/*
  Warnings:

  - You are about to drop the `project_scene` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "project_scene" DROP CONSTRAINT "project_scene_projectId_fkey";

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "data" JSONB;

-- DropTable
DROP TABLE "project_scene";
