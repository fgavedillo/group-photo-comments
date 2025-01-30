import { useState } from "react";

export const useIssueFilters = () => {
  const [areaFilter, setAreaFilter] = useState("");
  const [responsableFilter, setResponsableFilter] = useState("");

  const filterIssues = (messages: any[]) => {
    return messages.filter(m => {
      const areaMatch = !areaFilter || (m.area && m.area.toLowerCase().includes(areaFilter.toLowerCase()));
      const responsableMatch = !responsableFilter || (m.responsable && m.responsable.toLowerCase().includes(responsableFilter.toLowerCase()));
      return areaMatch && responsableMatch && m.imageUrl;
    });
  };

  return {
    areaFilter,
    responsableFilter,
    setAreaFilter,
    setResponsableFilter,
    filterIssues
  };
};