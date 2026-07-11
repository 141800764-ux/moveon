export function getPortalPath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "CARRIER_ADMIN":
    case "DISPATCHER":
    case "WAREHOUSE_MANAGER":
      return "/dashboard";
    case "DRIVER":
      return "/driver";
    case "CUSTOMER":
    default:
      return "/customer";
  }
}