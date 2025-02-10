provider "aws" {
  region = "us-west-2" # Change to your desired region
  alias = "oregon"
  default_tags {
    tags = {
      Product             = "uptime-calculation"
      Owner               = "Esakki"
      ApplicationOwner    = "Esakki"
      InfrastructureOwner = "Esakki"
    }
  }
}

provider "aws" {
    region = "us-west-1" # Change to your desired region
    alias = "california"
    default_tags {
        tags = {
            Product             = "uptime-calculation"
            Owner               = "Esakki"
            ApplicationOwner    = "Esakki"
            InfrastructureOwner = "Esakki"
        }
    }
}