import React, { useEffect } from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 3;
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    useEffect(() => {
        // Scroll to the top of the page when the currentPage changes
        window.scrollTo(0, 0);
    }, [currentPage]);

    return (
        <div className="pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
            >
                Prev
            </button>
            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                >
                    {number}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
            >
                Next
            </button>
        </div>
    );
};

export default Pagination; 