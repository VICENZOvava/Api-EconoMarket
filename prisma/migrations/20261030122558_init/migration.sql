-- CreateTable
CREATE TABLE `categoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Categoria_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itemlistacompra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listaDeComprasId` INTEGER NOT NULL,
    `produtoId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ItemListaCompra_produtoId_idx`(`produtoId`),
    UNIQUE INDEX `ItemListaCompra_listaDeComprasId_produtoId_key`(`listaDeComprasId`, `produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listadecompras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL DEFAULT 'Minha lista',
    `tipo` ENUM('FIXA', 'TEMPORARIA') NOT NULL DEFAULT 'FIXA',
    `usuarioId` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `ListaDeCompras_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fotoperfil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `tipo` VARCHAR(30) NOT NULL,
    `dados` LONGBLOB NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FotoPerfil_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mercado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Mercado_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `quantidade` DECIMAL(10, 3) NULL,
    `unidade` VARCHAR(191) NULL,
    `imagemUrl` VARCHAR(191) NULL,
    `categoriaId` INTEGER NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `Produto_categoriaId_idx`(`categoriaId`),
    INDEX `Produto_nome_idx`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtomercado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mercadoId` INTEGER NOT NULL,
    `produtoId` INTEGER NOT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `precoOriginal` DECIMAL(10, 2) NULL,
    `emPromocao` BOOLEAN NOT NULL DEFAULT false,
    `inicioPromocao` DATETIME(3) NULL,
    `fimPromocao` DATETIME(3) NULL,
    `disponivel` BOOLEAN NOT NULL DEFAULT true,
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `ProdutoMercado_mercadoId_idx`(`mercadoId`),
    INDEX `ProdutoMercado_produtoId_idx`(`produtoId`),
    UNIQUE INDEX `ProdutoMercado_mercadoId_produtoId_key`(`mercadoId`, `produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NULL,
    `firebaseUid` VARCHAR(191) NULL,
    `provedor` ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    `papel` ENUM('USUARIO', 'GERENTE') NOT NULL DEFAULT 'USUARIO',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    UNIQUE INDEX `Usuario_firebaseUid_key`(`firebaseUid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `itemlistacompra` ADD CONSTRAINT `ItemListaCompra_listaDeComprasId_fkey` FOREIGN KEY (`listaDeComprasId`) REFERENCES `listadecompras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itemlistacompra` ADD CONSTRAINT `ItemListaCompra_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listadecompras` ADD CONSTRAINT `ListaDeCompras_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fotoperfil` ADD CONSTRAINT `FotoPerfil_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produto` ADD CONSTRAINT `Produto_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categoria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtomercado` ADD CONSTRAINT `ProdutoMercado_mercadoId_fkey` FOREIGN KEY (`mercadoId`) REFERENCES `mercado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtomercado` ADD CONSTRAINT `ProdutoMercado_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
