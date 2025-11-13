import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@basango/ui/components/breadcrumb";
import { Separator } from "@basango/ui/components/separator";
//import { LanguageSelector, ThemeSelector } from "@/components/ui/shared/settings";
import { SidebarTrigger } from "@basango/ui/components/sidebar";

export function PageHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

//  <header className="border-b flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
//       <div className="flex items-center gap-2 px-4">
//         <SidebarTrigger className="-ml-1" />
//         <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
//         <Breadcrumb>
//           <BreadcrumbList>
//             <BreadcrumbItem className="hidden md:block">
//               <Button className="cursor-pointer" onClick={() => navigate(-1)} variant="ghost">
//                 <ArrowLeftIcon />
//                 <span>{t("ui.shared.shell.page_header.go_back")}</span>
//               </Button>
//             </BreadcrumbItem>
//           </BreadcrumbList>
//         </Breadcrumb>
//       </div>
//       <div className="flex items-center gap-2 px-4">
//         <LanguageSelector />
//         <ThemeSelector />
//       </div>
//     </header>
