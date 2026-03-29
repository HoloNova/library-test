package test.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "姓名不能为空")
    private String name;
    
    @NotBlank(message = "学号不能为空")
    private String studyID;
    
    @NotBlank(message = "密码不能为空")
    private String password;
}
