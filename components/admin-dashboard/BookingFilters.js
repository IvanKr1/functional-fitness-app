import React from "react";
import PropTypes from "prop-types";
import * as Form from "@radix-ui/react-form";
import * as Select from "@radix-ui/react-select";
import styles from "./BookingFilters.module.styl";

function BookingFilters({ filters, onFilterChange }) {
  const hours = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`); // 8:00 to 20:00

  const handleUserNameChange = (e) => {
    onFilterChange({ ...filters, userName: e.target.value });
  };

  const handleHourChange = (value) => {
    onFilterChange({ ...filters, bookingHour: value });
  };

  return (
    <Form.Root className={styles.filtersForm}>
      <div className={styles.filterGroup}>
        <Form.Field name="userName">
          <Form.Label className={styles.label}>Filter by Username</Form.Label>
          <Form.Control asChild>
            <input
              className={styles.input}
              type="text"
              value={filters.userName}
              onChange={handleUserNameChange}
              placeholder="Search by username..."
            />
          </Form.Control>
        </Form.Field>
      </div>

      <div className={styles.filterGroup}>
        <Form.Field name="bookingHour">
          <Form.Label className={styles.label}>Filter by Hour</Form.Label>
          <Select.Root
            value={filters.bookingHour}
            onValueChange={handleHourChange}
          >
            <Select.Trigger className={styles.selectTrigger}>
              <Select.Value placeholder="Select hour" />
              <Select.Icon className={styles.selectIcon} />
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className={styles.selectContent}>
                <Select.ScrollUpButton className={styles.selectScrollButton} />
                <Select.Viewport className={styles.selectViewport}>
                  <Select.Group>
                    <Select.Item value="" className={styles.selectItem}>
                      <Select.ItemText>All Hours</Select.ItemText>
                    </Select.Item>
                    {hours.map((hour) => (
                      <Select.Item
                        key={hour}
                        value={hour}
                        className={styles.selectItem}
                      >
                        <Select.ItemText>{hour}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Group>
                </Select.Viewport>
                <Select.ScrollDownButton
                  className={styles.selectScrollButton}
                />
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </Form.Field>
      </div>
    </Form.Root>
  );
}

BookingFilters.propTypes = {
  filters: PropTypes.shape({
    userName: PropTypes.string.isRequired,
    bookingHour: PropTypes.string.isRequired,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
};
