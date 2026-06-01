-- CreateTable
CREATE TABLE "ProductList" (
    "id" SERIAL NOT NULL,
    "product_name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "upload_date_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image" TEXT,
    "description" TEXT,
    "product_status" TEXT NOT NULL,
    "category_table_id" INTEGER NOT NULL,

    CONSTRAINT "ProductList_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductList" ADD CONSTRAINT "ProductList_category_table_id_fkey" FOREIGN KEY ("category_table_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
