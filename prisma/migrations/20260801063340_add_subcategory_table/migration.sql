-- AlterTable
ALTER TABLE "ProductList" ADD COLUMN     "subcategory_table_id" INTEGER;

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" SERIAL NOT NULL,
    "subcategory_name" TEXT NOT NULL,
    "category_table_id" INTEGER NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_category_table_id_subcategory_name_key" ON "Subcategory"("category_table_id", "subcategory_name");

-- AddForeignKey
ALTER TABLE "ProductList" ADD CONSTRAINT "ProductList_subcategory_table_id_fkey" FOREIGN KEY ("subcategory_table_id") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_category_table_id_fkey" FOREIGN KEY ("category_table_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
