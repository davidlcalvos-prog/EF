terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "Región AWS para el despliegue"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "ef-platform"
}

variable "environment" {
  description = "Entorno (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# ECR Repositories
resource "aws_ecr_repository" "services" {
  for_each = toset(["api-gateway", "auth-service", "users-service"])

  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment != "prod"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = "1.31"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size     = 2
      max_size     = 5
      desired_size = 2
      instance_types = ["t3.medium"]
    }
  }

  enable_cluster_creator_admin_permissions = true
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "prod"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-postgres"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "ef_db"
  username               = "ef_user"
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  skip_final_snapshot    = var.environment != "prod"
  publicly_accessible    = false
}

variable "db_password" {
  description = "Contraseña de PostgreSQL (usar AWS Secrets Manager en producción)"
  type        = string
  sensitive   = true
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# DocumentDB (compatible con MongoDB)
resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier      = "${var.project_name}-docdb"
  engine                  = "docdb"
  master_username         = "ef_user"
  master_password         = var.db_password
  vpc_security_group_ids  = [aws_security_group.docdb.id]
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  skip_final_snapshot     = var.environment != "prod"
}

resource "aws_docdb_subnet_group" "main" {
  name       = "${var.project_name}-docdb-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "docdb" {
  name        = "${var.project_name}-docdb-sg"
  description = "Security group for DocumentDB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "ecr_repository_urls" {
  value = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
