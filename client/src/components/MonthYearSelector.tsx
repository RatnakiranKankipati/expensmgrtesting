import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS } from "@/lib/constants";

interface MonthYearSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthYearChange: (month: number, year: number) => void;
}

export default function MonthYearSelector({
  selectedMonth,
  selectedYear,
  onMonthYearChange,
}: MonthYearSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      onMonthYearChange(12, selectedYear - 1);
    } else {
      onMonthYearChange(selectedMonth - 1, selectedYear);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthYearChange(1, selectedYear + 1);
    } else {
      onMonthYearChange(selectedMonth + 1, selectedYear);
    }
  };

  const goToCurrentMonth = () => {
    onMonthYearChange(currentMonth, currentYear);
  };

  const handleMonthChange = (month: string) => {
    onMonthYearChange(parseInt(month), selectedYear);
  };

  const handleYearChange = (year: string) => {
    onMonthYearChange(selectedMonth, parseInt(year));
  };

  // Generate year options (current year ± 5 years)
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    years.push(year);
  }

  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  return (
    <div className="flex items-center space-x-2">
      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousMonth}
        className="p-1 h-8 w-8"
        data-testid="button-previous-month"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Month Year Display/Selector */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 bg-accent px-3 py-2 rounded-lg hover:bg-accent/80"
            data-testid="button-month-year-selector"
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium" data-testid="text-selected-month">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="text-sm font-medium">Select Month & Year</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Month</label>
                <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Year</label>
                <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger data-testid="select-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                disabled={isCurrentMonth}
                data-testid="button-current-month"
              >
                Current Month
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-selector"
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Next month arrow */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextMonth}
        className="p-1 h-8 w-8"
        data-testid="button-next-month"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}