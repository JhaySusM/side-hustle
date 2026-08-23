-- CreateIndex
CREATE INDEX "ProductList_product_status_id_idx" ON "ProductList"("product_status", "id");

-- CreateIndex
CREATE INDEX "ProductList_category_table_id_idx" ON "ProductList"("category_table_id");
