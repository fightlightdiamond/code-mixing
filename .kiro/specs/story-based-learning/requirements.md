# Requirements Document

## Introduction

Trang học tiếng Anh bằng phương pháp truyện chêm (Jewish-style story embedding) là một tính năng học tập tương tác cho phép người học tiếp thu từ vựng tiếng Anh một cách tự nhiên thông qua việc đọc truyện có chêm từ tiếng Anh. Phương pháp này dựa trên nguyên lý học ngôn ngữ tự nhiên, nơi từ vựng mới được giới thiệu trong ngữ cảnh có ý nghĩa, giúp người học ghi nhớ và sử dụng hiệu quả hơn.

## Requirements

### Requirement 1

**User Story:** Là một học viên, tôi muốn đọc truyện có chêm từ tiếng Anh để học từ vựng một cách tự nhiên và thú vị.

#### Acceptance Criteria

1. WHEN người dùng truy cập trang học tập THEN hệ thống SHALL hiển thị danh sách các truyện có sẵn theo cấp độ
2. WHEN người dùng chọn một truyện THEN hệ thống SHALL hiển thị nội dung truyện với từ tiếng Anh được chêm vào văn bản tiếng Việt
3. WHEN người dùng click vào từ tiếng Anh được chêm THEN hệ thống SHALL hiển thị nghĩa, phiên âm và ví dụ của từ đó
4. WHEN người dùng hoàn thành đọc truyện THEN hệ thống SHALL cập nhật tiến độ học tập của người dùng

### Requirement 2

**User Story:** Là một học viên, tôi muốn nghe phát âm của từ vựng và toàn bộ truyện để cải thiện kỹ năng nghe và phát âm.

#### Acceptance Criteria

1. WHEN người dùng click vào biểu tượng âm thanh của từ vựng THEN hệ thống SHALL phát âm thanh phát âm của từ đó
2. WHEN người dùng click vào nút phát âm toàn bộ truyện THEN hệ thống SHALL phát âm thanh đọc toàn bộ nội dung truyện
3. WHEN âm thanh đang phát THEN hệ thống SHALL highlight từ hoặc câu đang được đọc
4. WHEN người dùng tạm dừng âm thanh THEN hệ thống SHALL lưu vị trí tạm dừng để tiếp tục sau

### Requirement 3

**User Story:** Là một học viên, tôi muốn thực hiện các bài tập tương tác dựa trên nội dung truyện để củng cố kiến thức.

#### Acceptance Criteria

1. WHEN người dùng hoàn thành đọc truyện THEN hệ thống SHALL hiển thị các bài tập liên quan
2. WHEN người dùng làm bài tập điền từ THEN hệ thống SHALL kiểm tra đáp án và đưa ra phản hồi ngay lập tức
3. WHEN người dùng làm bài tập trắc nghiệm THEN hệ thống SHALL hiển thị kết quả và giải thích đáp án
4. WHEN người dùng hoàn thành tất cả bài tập THEN hệ thống SHALL tính điểm và cập nhật tiến độ

### Requirement 4

**User Story:** Là một học viên, tôi muốn theo dõi tiến độ học tập và từ vựng đã học để quản lý quá trình học của mình.

#### Acceptance Criteria

1. WHEN người dùng truy cập trang tiến độ THEN hệ thống SHALL hiển thị số truyện đã đọc, từ vựng đã học và điểm số
2. WHEN người dùng xem chi tiết từ vựng THEN hệ thống SHALL hiển thị danh sách từ theo trạng thái (mới, đang ôn, đã thuộc)
3. WHEN người dùng muốn ôn tập THEN hệ thống SHALL đề xuất từ vựng cần ôn tập dựa trên thuật toán spaced repetition
4. WHEN người dùng hoàn thành một cấp độ THEN hệ thống SHALL mở khóa cấp độ tiếp theo

### Requirement 5

**User Story:** Là một học viên, tôi muốn tùy chỉnh trải nghiệm học tập theo sở thích cá nhân để học hiệu quả hơn.

#### Acceptance Criteria

1. WHEN người dùng truy cập cài đặt THEN hệ thống SHALL cho phép điều chỉnh tỷ lệ chêm từ tiếng Anh (10%-50%)
2. WHEN người dùng thay đổi cấp độ khó THEN hệ thống SHALL lọc truyện phù hợp với cấp độ đã chọn
3. WHEN người dùng chọn chủ đề yêu thích THEN hệ thống SHALL ưu tiên hiển thị truyện thuộc chủ đề đó
4. WHEN người dùng bật chế độ tối THEN hệ thống SHALL thay đổi giao diện sang chế độ tối để bảo vệ mắt

### Requirement 6

**User Story:** Là một học viên, tôi muốn có thể học offline và đồng bộ tiến độ khi có kết nối internet.

#### Acceptance Criteria

1. WHEN người dùng tải truyện về máy THEN hệ thống SHALL lưu trữ nội dung và âm thanh để truy cập offline
2. WHEN người dùng học offline THEN hệ thống SHALL lưu tiến độ tạm thời trên thiết bị
3. WHEN thiết bị kết nối internet trở lại THEN hệ thống SHALL tự động đồng bộ tiến độ lên server
4. WHEN có xung đột dữ liệu THEN hệ thống SHALL ưu tiên dữ liệu mới nhất và thông báo cho người dùng
